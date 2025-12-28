import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api, useAuth } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen,
  File,
  FileText,
  Image,
  Video,
  Plus,
  Upload,
  Trash2,
  Search,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function MyFiles() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'file' or 'folder'

  useEffect(() => {
    fetchData();
  }, [currentFolder]);

  const fetchData = async () => {
    try {
      const folderId = currentFolder || "null";
      const [filesRes, foldersRes] = await Promise.all([
        api.get(`/files?folder_id=${currentFolder || ""}`),
        api.get(`/folders?parent_id=${folderId}`),
      ]);
      setFiles(filesRes.data);
      setFolders(foldersRes.data);
    } catch (error) {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (currentFolder) {
      formData.append("folder_id", currentFolder);
    }

    try {
      const res = await api.post("/files/upload", formData);
      setFiles([res.data, ...files]);
      toast.success("File uploaded!");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    try {
      const res = await api.post("/folders", {
        name: newFolderName,
        parent_id: currentFolder,
      });
      setFolders([res.data, ...folders]);
      setFolderDialogOpen(false);
      setNewFolderName("");
      toast.success("Folder created!");
    } catch (error) {
      toast.error("Failed to create folder");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (deleteType === 'file') {
        await api.delete(`/files/${itemToDelete.id}`);
        setFiles(files.filter((f) => f.id !== itemToDelete.id));
        toast.success("File deleted");
      } else {
        await api.delete(`/folders/${itemToDelete.id}`);
        setFolders(folders.filter((f) => f.id !== itemToDelete.id));
        toast.success("Folder deleted");
      }
    } catch (error) {
      toast.error(`Failed to delete ${deleteType}`);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteType(null);
    }
  };

  const openDeleteDialog = (item, type) => {
    setItemToDelete(item);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const navigateToFolder = (folder) => {
    setFolderPath([...folderPath, { id: currentFolder, name: folderPath.length === 0 ? "My Files" : folderPath[folderPath.length - 1]?.name }]);
    setCurrentFolder(folder.id);
    setLoading(true);
  };

  const navigateBack = () => {
    const newPath = [...folderPath];
    const parent = newPath.pop();
    setFolderPath(newPath);
    setCurrentFolder(parent?.id || null);
    setLoading(true);
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("image")) return Image;
    if (fileType?.includes("video")) return Video;
    if (fileType?.includes("pdf")) return FileText;
    return File;
  };

  const filteredFiles = files.filter((f) =>
    f.filename?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="my-files">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Files</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal files and folders
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="create-folder-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10">
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new folder
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="bg-zinc-900/50 border-zinc-800"
                    data-testid="folder-name-input"
                  />
                  <Button onClick={handleCreateFolder} className="w-full bg-primary hover:bg-primary/90" data-testid="create-folder-submit-btn">
                    Create Folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileUpload} />
              <Button asChild disabled={uploading} data-testid="upload-file-btn">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Breadcrumb */}
        {currentFolder && (
          <div className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" onClick={navigateBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <span className="text-muted-foreground">/</span>
            {folderPath.map((p, i) => (
              <span key={i} className="text-muted-foreground">
                {p.name} <ChevronRight className="w-3 h-3 inline" />
              </span>
            ))}
            <span className="font-medium">Current</span>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800"
            data-testid="search-files-input"
          />
        </div>

        {/* Content */}
        {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
          <Card className="glass border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No files yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Upload files or create folders to organize your content
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Folders */}
            {filteredFolders.map((folder) => (
              <Card
                key={folder.id}
                className="glass border-white/10 card-interactive cursor-pointer"
                data-testid={`folder-${folder.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div 
                      className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center cursor-pointer"
                      onClick={() => navigateToFolder(folder)}
                    >
                      <FolderOpen className="w-6 h-6 text-primary" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(folder, 'folder');
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p 
                    className="font-medium mt-3 truncate cursor-pointer"
                    onClick={() => navigateToFolder(folder)}
                  >
                    {folder.name}
                  </p>
                  <p className="text-sm text-muted-foreground">Folder</p>
                </CardContent>
              </Card>
            ))}

            {/* Files */}
            {filteredFiles.map((file) => {
              const FileIcon = getFileIcon(file.file_type);
              return (
                <Card key={file.id} className="glass border-white/10 card-interactive" data-testid={`file-${file.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                        <FileIcon className="w-6 h-6 text-secondary" />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteDialog(file, 'file')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="font-medium mt-3 truncate">{file.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : "File"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="glass border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteType === 'folder' ? 'Folder' : 'File'}?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteType === 'folder' 
                  ? `This will delete the folder "${itemToDelete?.name}" and all its contents.`
                  : `This will delete the file "${itemToDelete?.filename}".`
                }
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setItemToDelete(null);
                setDeleteType(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
