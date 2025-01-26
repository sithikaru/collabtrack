export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }
  
  export interface Project {
    id: string;
    name: string;
    admin: string;
    members: string[];
    invitations: string[];
    createdAt: Date;
  }
  
  export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    assignees: string[];
    deadline: Date;
    createdAt: Date;
    updatedAt: Date;
  }