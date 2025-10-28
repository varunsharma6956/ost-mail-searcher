from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import tempfile
import shutil
import re

PYPFF_AVAILABLE = False
try:
    import pypff
    PYPFF_AVAILABLE = True
    print("✅ pypff library loaded successfully")
    logging.info("pypff library loaded successfully")
except ImportError as e:
    PYPFF_AVAILABLE = False
    print(f"❌ pypff not available: {str(e)}")
    logging.warning(f"pypff not available: {str(e)}")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")
class EmailMessage(BaseModel):
    subject: Optional[str] = None
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    recipients: Optional[str] = None
    date: Optional[str] = None
    body: Optional[str] = None
    has_attachments: bool = False
    attachment_count: int = 0
    attachment_names: List[str] = []
    email_id: Optional[str] = None


class SearchRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class FilePathRequest(BaseModel):
    file_path: str


# Store parsed emails in memory (for demo purposes)
parsed_emails_cache = []


def parse_ost_file(file_path: str) -> List[EmailMessage]:
    """Parse OST file and extract email messages"""
    emails = []
    
    if not PYPFF_AVAILABLE:
        # Don't fallback silently - raise error
        raise Exception("pypff library is not installed. Cannot parse OST files.")
    
    try:
        pst = pypff.file()
        pst.open(file_path)
        root = pst.get_root_folder()
        emails = parse_folder(root)
        
        pst.close()
        
        logging.info(f"Successfully parsed {len(emails)} emails from file")
        
    except Exception as e:
        logging.error(f"Error parsing OST file: {str(e)}")
        raise Exception(f"Failed to parse OST file: {str(e)}")
    
    return emails


def parse_folder(folder) -> List[EmailMessage]:
    """Recursively parse folder and extract messages"""
    messages = []
    
    try:
        # Parse sub-folders
        for sub_folder in folder.sub_folders:
            messages.extend(parse_folder(sub_folder))
        
        # Parse messages in current folder
        for message in folder.sub_messages:
            try:
                # Generate unique email ID
                import hashlib
                email_id = hashlib.md5(f"{message.subject}_{message.client_submit_time}".encode()).hexdigest()
                
                # Get attachment count and names (no data extraction)
                attachment_count = 0
                has_attachments = False
                attachment_names = []
                
                try:
                    if hasattr(message, 'number_of_attachments'):
                        attachment_count = message.number_of_attachments
                        has_attachments = attachment_count > 0
                        
                        # Get attachment names only
                        for i in range(attachment_count):
                            try:
                                attachment = message.get_attachment(i)
                                if hasattr(attachment, 'name') and attachment.name:
                                    attachment_names.append(attachment.name)
                            except:
                                # Skip problematic attachments silently
                                pass
                            
                except:
                    # If we can't get attachments, just continue without them
                    pass
                
                # Extract email body - try multiple formats
                body_text = ""
                
                # Try plain text first
                if hasattr(message, 'plain_text_body') and message.plain_text_body:
                    body_text = message.plain_text_body
                # Try HTML body
                elif hasattr(message, 'html_body') and message.html_body:
                    try:
                        # HTML body is bytes, need to decode
                        html_body = message.html_body
                        if isinstance(html_body, bytes):
                            body_text = html_body.decode('utf-8', errors='ignore')
                        else:
                            body_text = str(html_body)
                        
                        # Better HTML to text conversion - preserve structure
                        body_text = re.sub(r'<br\s*/?>', '\n', body_text, flags=re.IGNORECASE)
                        body_text = re.sub(r'</p>', '\n\n', body_text, flags=re.IGNORECASE)
                        body_text = re.sub(r'</div>', '\n', body_text, flags=re.IGNORECASE)
                        body_text = re.sub(r'</tr>', '\n', body_text, flags=re.IGNORECASE)
                        body_text = re.sub(r'</li>', '\n', body_text, flags=re.IGNORECASE)
                        body_text = re.sub(r'<li[^>]*>', '• ', body_text, flags=re.IGNORECASE)
                        
                        # Remove remaining HTML tags
                        body_text = re.sub('<[^<]+?>', '', body_text)
                        
                        # Clean up entities
                        body_text = body_text.replace('&nbsp;', ' ')
                        body_text = body_text.replace('&amp;', '&')
                        body_text = body_text.replace('&lt;', '<')
                        body_text = body_text.replace('&gt;', '>')
                        body_text = body_text.replace('&quot;', '"')
                        
                        # Clean up excessive whitespace but preserve line breaks
                        lines = body_text.split('\n')
                        lines = [line.strip() for line in lines]
                        body_text = '\n'.join(line for line in lines if line)
                        
                    except Exception as e:
                        logging.debug(f"Error extracting HTML body: {str(e)}")
                # Try RTF body as last resort
                elif hasattr(message, 'rtf_body') and message.rtf_body:
                    body_text = "[RTF content - preview not available]"
                
                # Get email date - the client_submit_time is already in local timezone
                email_date = None
                if hasattr(message, 'client_submit_time') and message.client_submit_time:
                    email_date = str(message.client_submit_time)
                
                email_msg = EmailMessage(
                    email_id=email_id,
                    subject=message.subject if hasattr(message, 'subject') and message.subject else "(No Subject)",
                    sender_name=message.sender_name if hasattr(message, 'sender_name') and message.sender_name else "Unknown",
                    sender_email=message.sender_email_address if hasattr(message, 'sender_email_address') and message.sender_email_address else "",
                    recipients=message.display_to if hasattr(message, 'display_to') and message.display_to else "",
                    date=email_date,
                    body=body_text if body_text else "",
                    has_attachments=has_attachments,
                    attachment_count=attachment_count,
                    attachment_names=attachment_names
                )
                
                messages.append(email_msg)
            except Exception as e:
                # Only log if it's not an attachment error
                if "attachment" not in str(e).lower():
                    logging.debug(f"Skipping message due to error: {str(e)}")
                continue
                
    except Exception as e:
        logging.error(f"Error parsing folder: {str(e)}")
    
    return messages


def get_sample_emails() -> List[EmailMessage]:
    """Return sample email data for demonstration"""
    return [
        EmailMessage(
            subject="Q4 Financial Report",
            sender_name="John Smith",
            sender_email="john.smith@company.com",
            recipients="finance-team@company.com",
            date="2025-01-15 09:30:00",
            body="Please find attached the Q4 financial report. The revenue increased by 25% compared to Q3. Key highlights include:\n\n- Revenue: $2.5M\n- Expenses: $1.2M\n- Net Profit: $1.3M\n\nLet's schedule a meeting to discuss the results.",
            has_attachments=True,
            attachment_count=2,
            attachment_names=["Q4_Report.pdf", "Financial_Summary.xlsx"]
        ),
        EmailMessage(
            subject="Team Meeting - Project Update",
            sender_name="Sarah Johnson",
            sender_email="sarah.j@company.com",
            recipients="team@company.com",
            date="2025-01-20 14:00:00",
            body="Hi Team,\n\nJust a reminder about our weekly sync meeting today at 2 PM. We'll discuss:\n\n1. Sprint progress\n2. Blockers and challenges\n3. Next week's priorities\n\nSee you all there!",
            has_attachments=False,
            attachment_count=0,
            attachment_names=[]
        ),
        EmailMessage(
            subject="RE: Client Presentation Slides",
            sender_name="Michael Brown",
            sender_email="m.brown@company.com",
            recipients="varunsharma@company.com",
            date="2025-02-01 10:15:00",
            body="Hi Varun,\n\nI've reviewed the presentation slides and they look great! Just a few minor suggestions:\n\n- Add more visuals to slide 5\n- Include the ROI metrics on slide 8\n- Update the timeline on the last slide\n\nOverall, excellent work!",
            has_attachments=True,
            attachment_count=1,
            attachment_names=["Presentation_v3.pptx"]
        ),
        EmailMessage(
            subject="Invoice #12345 - Payment Reminder",
            sender_name="Accounts Department",
            sender_email="accounts@vendor.com",
            recipients="billing@company.com",
            date="2025-02-10 08:00:00",
            body="Dear Customer,\n\nThis is a friendly reminder that Invoice #12345 dated January 15, 2025 is due for payment.\n\nAmount Due: $5,000\nDue Date: February 15, 2025\n\nPlease process the payment at your earliest convenience.",
            has_attachments=True,
            attachment_count=1,
            attachment_names=["Invoice_12345.pdf"]
        ),
        EmailMessage(
            subject="Welcome to the Company!",
            sender_name="HR Department",
            sender_email="hr@company.com",
            recipients="newemployee@company.com",
            date="2025-02-15 09:00:00",
            body="Welcome aboard!\n\nWe're excited to have you join our team. Your first day is scheduled for February 20, 2025.\n\nPlease review the attached onboarding documents and complete the required forms before your start date.\n\nLooking forward to working with you!",
            has_attachments=True,
            attachment_count=3,
            attachment_names=["Employee_Handbook.pdf", "Benefits_Info.pdf", "Tax_Forms.pdf"]
        ),
        EmailMessage(
            subject="System Maintenance Notification",
            sender_name="IT Department",
            sender_email="it-support@company.com",
            recipients="all-staff@company.com",
            date="2025-03-01 16:30:00",
            body="IMPORTANT NOTICE:\n\nScheduled system maintenance will occur on March 5, 2025 from 10 PM to 2 AM.\n\nDuring this time:\n- Email services will be unavailable\n- File servers will be offline\n- VPN access will be disabled\n\nPlease plan accordingly and save your work before the maintenance window.",
            has_attachments=False,
            attachment_count=0,
            attachment_names=[]
        ),
        EmailMessage(
            subject="Project Proposal - New Initiative",
            sender_name="Emily Davis",
            sender_email="emily.davis@company.com",
            recipients="management@company.com",
            date="2025-03-10 11:20:00",
            body="Dear Management Team,\n\nI'd like to propose a new initiative to improve our customer engagement metrics. The proposal includes:\n\n- Implementation of AI-powered chatbot\n- Customer feedback survey system\n- Automated email campaigns\n\nEstimated budget: $50,000\nTimeline: 6 months\n\nPlease review the attached detailed proposal.",
            has_attachments=True,
            attachment_count=2,
            attachment_names=["Proposal_Document.docx", "Budget_Breakdown.xlsx"]
        ),
        EmailMessage(
            subject="Conference Registration Confirmation",
            sender_name="Event Organizer",
            sender_email="events@conference.com",
            recipients="varunsharma@company.com",
            date="2025-03-20 13:45:00",
            body="Thank you for registering for Tech Summit 2025!\n\nEvent Details:\nDate: April 15-17, 2025\nVenue: Convention Center, Downtown\nYour Registration ID: TS2025-7823\n\nPlease bring a printed copy of this confirmation email to the registration desk.",
            has_attachments=True,
            attachment_count=1,
            attachment_names=["Event_Pass.pdf"]
        )
    ]


def filter_emails_by_date(emails: List[EmailMessage], start_date: Optional[str], end_date: Optional[str]) -> List[EmailMessage]:
    """Filter emails by date range"""
    if not start_date and not end_date:
        return emails
    
    filtered = []
    
    # Parse filter dates
    start_dt = None
    end_dt = None
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            # Remove timezone info for comparison
            start_dt = start_dt.replace(tzinfo=None)
        except Exception as e:
            logging.error(f"Error parsing start_date {start_date}: {str(e)}")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            # Remove timezone info for comparison
            end_dt = end_dt.replace(tzinfo=None)
        except Exception as e:
            logging.error(f"Error parsing end_date {end_date}: {str(e)}")
    
    logging.info(f"Filtering {len(emails)} emails. Start: {start_dt}, End: {end_dt}")
    
    for email in emails:
        if not email.date:
            continue
        
        try:
            # Parse email date - try multiple formats
            email_date = None
            
            # Try ISO format first
            if 'T' in email.date:
                email_date = datetime.fromisoformat(email.date.replace('Z', ''))
            else:
                # Try space-separated format
                email_date = datetime.strptime(email.date.split('.')[0], '%Y-%m-%d %H:%M:%S')
            
            # Remove timezone info for comparison
            if email_date.tzinfo:
                email_date = email_date.replace(tzinfo=None)
            
            # Check date range
            include_email = True
            
            if start_dt and email_date < start_dt:
                include_email = False
            
            if end_dt and email_date > end_dt:
                include_email = False
            
            if include_email:
                filtered.append(email)
                logging.debug(f"Including email: {email.subject[:50]} - Date: {email_date}")
            else:
                logging.debug(f"Excluding email: {email.subject[:50]} - Date: {email_date}")
                
        except Exception as e:
            logging.error(f"Error parsing email date '{email.date}': {str(e)}")
            continue
    
    logging.info(f"Filtered to {len(filtered)} emails")
    return filtered


@api_router.get("/")
async def root():
    return {"message": "OST Email Search API", "status": "active"}


@api_router.post("/upload-ost")
async def upload_ost_file(file: UploadFile = File(...)):
    """Upload and parse OST file"""
    global parsed_emails_cache
    
    if not file.filename.lower().endswith('.ost'):
        raise HTTPException(status_code=400, detail="Only OST files are supported")
    
    # Check if pypff is available
    if not PYPFF_AVAILABLE:
        raise HTTPException(
            status_code=501, 
            detail="OST parsing library (pypff) is not installed. Please use the 'Load Sample Data' button to test the application, or install pypff library to parse real OST files."
        )
    
    # Save uploaded file temporarily
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp:
            temp_file = temp.name
            shutil.copyfileobj(file.file, temp)
        
        # Parse the file
        emails = parse_ost_file(temp_file)
        
        if len(emails) == 0:
            raise HTTPException(
                status_code=400,
                detail="No emails found in the file. The file may be empty, corrupted, or encrypted."
            )
        
        parsed_emails_cache = emails
        
        return {
            "success": True,
            "message": f"Successfully parsed {len(parsed_emails_cache)} emails from your file",
            "email_count": len(parsed_emails_cache),
            "emails": parsed_emails_cache
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error uploading OST file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except:
                pass
        file.file.close()


@api_router.post("/browse-file")
async def browse_file(request: FilePathRequest):
    """Parse OST file from local file path"""
    global parsed_emails_cache
    
    file_path = request.file_path
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found at specified path")
    
    if not file_path.lower().endswith('.ost'):
        raise HTTPException(status_code=400, detail="Only OST files are supported")
    
    # Check if pypff is available
    if not PYPFF_AVAILABLE:
        raise HTTPException(
            status_code=501, 
            detail="OST parsing library (pypff) is not installed. Please use the 'Load Sample Data' button to test the application, or install pypff library to parse real OST files."
        )
    
    try:
        # Parse the file
        emails = parse_ost_file(file_path)
        
        if len(emails) == 0:
            raise HTTPException(
                status_code=400,
                detail="No emails found in the file. The file may be empty, corrupted, or encrypted."
            )
        
        parsed_emails_cache = emails
        
        return {
            "success": True,
            "message": f"Successfully parsed {len(parsed_emails_cache)} emails from your file",
            "email_count": len(parsed_emails_cache),
            "emails": parsed_emails_cache
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error parsing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@api_router.post("/search-emails")
async def search_emails(search_request: SearchRequest):
    """Search emails with date filters"""
    global parsed_emails_cache
    
    if not parsed_emails_cache:
        return {
            "success": True,
            "message": "No emails loaded. Please upload or browse an OST file first.",
            "email_count": 0,
            "emails": []
        }
    
    # Filter emails by date
    filtered_emails = filter_emails_by_date(
        parsed_emails_cache,
        search_request.start_date,
        search_request.end_date
    )
    
    return {
        "success": True,
        "message": f"Found {len(filtered_emails)} emails matching criteria",
        "email_count": len(filtered_emails),
        "emails": filtered_emails
    }


@api_router.get("/load-sample-data")
async def load_sample_data():
    """Load sample email data for testing"""
    global parsed_emails_cache
    parsed_emails_cache = get_sample_emails()
    
    return {
        "success": True,
        "message": f"Loaded {len(parsed_emails_cache)} sample emails",
        "email_count": len(parsed_emails_cache),
        "emails": parsed_emails_cache
    }




# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
