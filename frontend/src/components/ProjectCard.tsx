
import React from 'react';
import { FileText, MessageSquare, Clock, MoreVertical, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const ProjectCard = ({ project, onSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'processing') {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-4">
          <Badge className={`${getStatusColor(project.status)} flex items-center gap-1`}>
            {getStatusIcon(project.status)}
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            {project.lastUsed}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-2 text-blue-500" />
            <span>{project.documentCount} docs</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MessageSquare className="h-4 w-4 mr-2 text-purple-500" />
            <span>12 chats</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button 
          onClick={() => onSelect(project)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          Open Project
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
