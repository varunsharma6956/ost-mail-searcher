import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { X, User, Mail, Calendar, Paperclip, ArrowLeft, FileText } from "lucide-react";

const EmailViewer = ({ email, onClose }) => {
  if (!email) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4" data-testid="email-viewer">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Button
          data-testid="back-to-list-btn"
          onClick={onClose}
          variant="outline"
          size="sm"
          className="border-gray-700 hover:bg-gray-800 text-gray-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {email.subject || "(No Subject)"}
              </CardTitle>
              
              {/* Email metadata */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">From:</span>
                  <span className="text-white font-medium">
                    {email.sender_name || "Unknown"}
                  </span>
                  {email.sender_email && (
                    <span className="text-gray-500">&lt;{email.sender_email}&gt;</span>
                  )}
                </div>

                {email.recipients && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">To:</span>
                    <span className="text-gray-300">{email.recipients}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400">Date:</span>
                  <span className="text-gray-300">{formatDate(email.date)}</span>
                </div>

                {email.has_attachments && (
                  <div className="flex items-start space-x-2 text-sm">
                    <Paperclip className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-400">Has {email.attachment_count} attachment{email.attachment_count > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <Separator className="bg-gray-700" />

        <CardContent className="pt-6">
          <ScrollArea className="h-[400px] w-full pr-4">
            {email.body && email.body.trim() !== "" ? (
              <div
                data-testid="email-body"
                className="text-gray-300 leading-relaxed whitespace-pre-wrap"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  lineHeight: '1.7'
                }}
              >
                {email.body}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-gray-800/50 rounded-full mb-3">
                  <FileText className="w-12 h-12 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">No email body content available</p>
                <p className="text-gray-600 text-xs mt-1">This email may be empty or content couldn't be extracted</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailViewer;
