import React, { useState } from "react";
import axios from "axios";
import { Upload, FolderOpen, Search, Calendar, Mail, Paperclip, User, Clock, X, FileText, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import DateRangePicker from "./DateRangePicker";
import EmailViewer from "./EmailViewer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const OSTExplorer = () => {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [localFilePath, setLocalFilePath] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmails, setShowEmails] = useState(true);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.ost')) {
      toast.error("Please select an OST file");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload-ost`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setEmails(response.data.emails);
      setFilteredEmails(response.data.emails);
      setShowEmails(false);
      toast.success(`Successfully loaded ${response.data.email_count} emails. Click the eye icon to view.`);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail || "Failed to upload file";
      
      if (error.response?.status === 501) {
        // pypff not available
        toast.error(errorMessage, { duration: 8000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle local file path
  const handleLocalFileBrowse = async () => {
    if (!localFilePath.trim()) {
      toast.error("Please enter a file path");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/browse-file`, {
        file_path: localFilePath,
      });

      setEmails(response.data.emails);
      setFilteredEmails(response.data.emails);
      setShowEmails(false);
      toast.success(`Successfully loaded ${response.data.email_count} emails. Click the eye icon to view.`);
    } catch (error) {
      console.error('Browse error:', error);
      const errorMessage = error.response?.data?.detail || "Failed to load file";
      
      if (error.response?.status === 501) {
        // pypff not available
        toast.error(errorMessage, { duration: 8000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search with date filters
  const handleSearch = async () => {
    if (emails.length === 0) {
      toast.error("Please load emails first");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/search-emails`, {
        start_date: dateRange.start ? dateRange.start.toISOString() : null,
        end_date: dateRange.end ? dateRange.end.toISOString() : null,
      });

      setFilteredEmails(response.data.emails);
      setShowEmails(true);
      toast.success(`Found ${response.data.email_count} emails`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search emails");
    } finally {
      setLoading(false);
    }
  };

  // Load sample data
  const loadSampleData = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${API}/load-sample-data`);
      setEmails(response.data.emails);
      setFilteredEmails(response.data.emails);
      setShowEmails(false);
      toast.success(`Loaded ${response.data.email_count} sample emails. Click the eye icon to view.`);
    } catch (error) {
      console.error('Sample data error:', error);
      toast.error("Failed to load sample data");
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setDateRange({ start: null, end: null });
    setFilteredEmails(emails);
    if (emails.length > 0) {
      setShowEmails(true);
    }
    toast.info("Filters reset");
  };

  // Toggle email visibility
  const toggleEmailVisibility = () => {
    if (showEmails) {
      // Hide emails
      setShowEmails(false);
    } else {
      // Show emails - show all emails, not just filtered
      setFilteredEmails(emails);
      setShowEmails(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  OST Explorer
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Search and analyze your Outlook emails</p>
              </div>
            </div>
            <Button
              data-testid="load-sample-btn"
              onClick={loadSampleData}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800 text-gray-300"
            >
              <FileText className="w-4 h-4 mr-2" />
              Load Sample Data
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Panel - Upload & Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload Card */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm" data-testid="upload-card">
              <CardHeader>
                <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Load OST File
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload or browse a local .ost file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                    <TabsTrigger value="upload" data-testid="upload-tab" className="data-[state=active]:bg-gray-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="browse" data-testid="browse-tab" className="data-[state=active]:bg-gray-700">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Browse
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4 mt-4">
                    <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        accept=".ost"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        data-testid="file-upload-input"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center space-y-3"
                      >
                        <div className="p-4 bg-blue-500/10 rounded-full">
                          <Upload className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-gray-300 font-medium">Click to upload</p>
                          <p className="text-gray-500 text-sm mt-1">OST files only</p>
                        </div>
                      </label>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="browse" className="space-y-4 mt-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                      <p className="text-blue-300 text-xs font-medium mb-1">📁 Enter full file path:</p>
                      <p className="text-blue-200 text-xs">
                        C:\Users\HP\AppData\Local\Microsoft\Outlook\<span className="text-yellow-300 font-semibold">yourname@outlook.com.ost</span>
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="file-path" className="text-gray-300 font-medium">
                        Enter Complete OST File Path
                      </Label>
                      <Input
                        id="file-path"
                        data-testid="file-path-input"
                        placeholder="C:\Users\HP\AppData\Local\Microsoft\Outlook\email@outlook.com.ost"
                        value={localFilePath}
                        onChange={(e) => setLocalFilePath(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500 font-mono text-sm"
                      />
                      <Button
                        data-testid="browse-file-btn"
                        onClick={handleLocalFileBrowse}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {loading ? "Loading..." : "Load OST File"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Date Filter Card */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm" data-testid="filter-card">
              <CardHeader>
                <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  <Calendar className="w-5 h-5 inline-block mr-2" />
                  Date Filter
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Filter emails by date range
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />

                <div className="flex space-x-2">
                  <Button
                    data-testid="search-btn"
                    onClick={handleSearch}
                    disabled={loading || emails.length === 0}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button
                    data-testid="reset-btn"
                    onClick={resetFilters}
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800 text-gray-300"
                  >
                    Reset
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Emails:</span>
                    <span className="text-white font-semibold">{emails.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Filtered Results:</span>
                    <span className="text-blue-400 font-semibold">{filteredEmails.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Email List & Viewer */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm min-h-[700px]" data-testid="results-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      Email Results
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      {emails.length === 0
                        ? "No emails loaded. Upload an OST file or load sample data."
                        : showEmails
                        ? `Showing ${filteredEmails.length} email${filteredEmails.length !== 1 ? 's' : ''}`
                        : `${emails.length} email${emails.length !== 1 ? 's' : ''} loaded (hidden)`}
                    </CardDescription>
                  </div>
                  {emails.length > 0 && (
                    <Button
                      data-testid="toggle-visibility-btn"
                      onClick={toggleEmailVisibility}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 hover:bg-gray-800 text-gray-300"
                    >
                      {showEmails ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Show
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-6 bg-gray-800/50 rounded-full mb-4">
                      <Mail className="w-16 h-16 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Emails Loaded</h3>
                    <p className="text-gray-500 max-w-md">
                      Upload an OST file or load sample data to start exploring your emails.
                    </p>
                  </div>
                ) : !showEmails ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-6 bg-gray-800/50 rounded-full mb-4">
                      <EyeOff className="w-16 h-16 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">Emails Hidden</h3>
                    <p className="text-gray-500 max-w-md mb-4">
                      {emails.length} email{emails.length !== 1 ? 's are' : ' is'} loaded but hidden.
                    </p>
                    <Button
                      data-testid="show-emails-btn"
                      onClick={toggleEmailVisibility}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Show Emails
                    </Button>
                  </div>
                ) : selectedEmail ? (
                  <EmailViewer email={selectedEmail} onClose={() => setSelectedEmail(null)} />
                ) : filteredEmails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-6 bg-gray-800/50 rounded-full mb-4">
                      <Search className="w-16 h-16 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Emails Match Filters</h3>
                    <p className="text-gray-500 max-w-md">
                      Try adjusting your date range or click Reset to show all emails.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {filteredEmails.map((email, index) => (
                        <div
                          key={index}
                          data-testid={`email-item-${index}`}
                          onClick={() => setSelectedEmail(email)}
                          className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-blue-500 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-white truncate">
                                  {email.sender_name || email.sender_email || "Unknown Sender"}
                                </span>
                                {email.has_attachments && (
                                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                                    <Paperclip className="w-3 h-3 mr-1" />
                                    {email.attachment_count}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="text-base font-semibold text-gray-200 mb-2 group-hover:text-blue-400 transition-colors">
                                {email.subject || "(No Subject)"}
                              </h4>
                              <p className="text-sm text-gray-400 line-clamp-2">
                                {email.body ? email.body.substring(0, 150) + (email.body.length > 150 ? "..." : "") : "No content"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2 ml-4">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {email.date ? new Date(email.date).toLocaleDateString() : "No date"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSTExplorer;
