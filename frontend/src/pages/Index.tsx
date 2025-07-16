
import React, { useState } from 'react';
import { Plus, FileText, MessageSquare, Upload, Zap, Brain, Search, ChevronRight } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import ChatInterface from '../components/ChatInterface';
import FileUpload from '../components/FileUpload';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const Index = () => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Research Papers Analysis",
      description: "AI and Machine Learning research papers",
      documentCount: 24,
      lastUsed: "2 hours ago",
      status: "active"
    },
    {
      id: 2,
      name: "Company Handbook",
      description: "Employee policies and procedures",
      documentCount: 8,
      lastUsed: "1 day ago",
      status: "processing"
    },
    {
      id: 3,
      name: "Legal Documents",
      description: "Contract analysis and compliance",
      documentCount: 15,
      lastUsed: "3 days ago",
      status: "active"
    }
  ]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: projects.length + 1,
        name: newProjectName,
        description: newProjectDescription,
        documentCount: 0,
        lastUsed: "Just now",
        status: "active"
      };
      setProjects([...projects, newProject]);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateProject(false);
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setCurrentView('chat');
  };

  const stats = [
    { label: "Total Projects", value: projects.length, icon: FileText },
    { label: "Documents Processed", value: "47", icon: Upload },
    { label: "Conversations", value: "156", icon: MessageSquare },
    { label: "Active Models", value: "3", icon: Brain }
  ];

  if (currentView === 'chat' && selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Dashboard
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h1>
                  <p className="text-sm text-gray-600">{selectedProject.description}</p>
                </div>
              </div>
              <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                {selectedProject.status}
              </Badge>
            </div>
          </div>
        </div>
        <ChatInterface project={selectedProject} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AutoRAG
                </h1>
                <p className="text-sm text-gray-600">Intelligent Document Analysis Platform</p>
              </div>
            </div>
            <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Project Name</label>
                    <Input
                      placeholder="Enter project name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Input
                      placeholder="Brief description of your project"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateProject} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Smart Ingestion</CardTitle>
              <CardDescription>
                Upload documents, images, or URLs. Our AI extracts and processes content with OCR and intelligent parsing.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Vector Search</CardTitle>
              <CardDescription>
                Advanced semantic search across all your documents using state-of-the-art embedding models.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>AI Chat</CardTitle>
              <CardDescription>
                Ask questions and get intelligent answers backed by your documents with source citations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
            <Button variant="outline" className="text-gray-600">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onSelect={handleSelectProject}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Create your first project and start uploading documents to experience the power of AI-driven document analysis.
            </p>
            <Button 
              onClick={() => setShowCreateProject(true)}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
