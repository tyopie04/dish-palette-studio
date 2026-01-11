import { useState } from 'react';
import { 
  MessageSquarePlus, 
  Search, 
  FolderOpen, 
  MessageCircle, 
  ChevronDown,
  Sparkles,
  Clock,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatConversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
}

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Mock data for demonstration
const mockConversations: ChatConversation[] = [
  { id: '1', title: 'Menu Photography Ideas', updatedAt: new Date() },
  { id: '2', title: 'Instagram Caption Generator', updatedAt: new Date(Date.now() - 3600000) },
  { id: '3', title: 'Weekly Promo Planning', updatedAt: new Date(Date.now() - 86400000) },
  { id: '4', title: 'New Dish Launch Strategy', updatedAt: new Date(Date.now() - 172800000) },
  { id: '5', title: 'Customer Engagement Tips', updatedAt: new Date(Date.now() - 259200000) },
];

const mockProjects = [
  { id: 'p1', name: 'Summer Menu Campaign', icon: '🌴' },
  { id: 'p2', name: 'Holiday Promotions', icon: '🎄' },
];

export function ChatSidebar({
  conversations = mockConversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  isCollapsed = false,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isCollapsed) {
    return (
      <div className="w-14 h-full bg-[hsl(220,20%,12%)] border-r border-white/5 flex flex-col items-center py-4 gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <PanelLeft className="w-5 h-5 text-white/60" />
        </button>
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="New chat"
        >
          <MessageSquarePlus className="w-5 h-5 text-white/60" />
        </button>
        <button
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5 text-white/60" />
        </button>
        <button
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Projects"
        >
          <FolderOpen className="w-5 h-5 text-white/60" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 h-full bg-[hsl(220,20%,12%)] border-r border-white/5 flex flex-col">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white/80" />
          <span className="font-semibold text-white/90 text-sm">Stax AI</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <PanelLeftClose className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Actions */}
      <div className="p-2 space-y-1">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New chat</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats"
            className="pl-9 h-9 bg-white/5 border-white/10 text-white/80 placeholder:text-white/40 text-sm rounded-lg"
          />
        </div>
      </div>

      {/* Projects Section */}
      <div className="px-2 py-1">
        <button
          onClick={() => setProjectsExpanded(!projectsExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:bg-white/5 transition-colors uppercase tracking-wide"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Projects</span>
          </div>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform",
            projectsExpanded ? "" : "-rotate-90"
          )} />
        </button>
        
        {projectsExpanded && (
          <div className="mt-1 space-y-0.5">
            {mockProjects.map(project => (
              <button
                key={project.id}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors"
              >
                <span className="text-base">{project.icon}</span>
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Your Chats */}
      <div className="flex-1 flex flex-col min-h-0 px-2 py-1">
        <div className="px-3 py-2 text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Your chats</span>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-0.5 pr-2">
            {filteredConversations.length === 0 ? (
              <p className="px-3 py-4 text-sm text-white/40 text-center">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
            ) : (
              filteredConversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    activeConversationId === conversation.id
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10"
                  )}
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{conversation.title}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer - Usage/Credits */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Daily credits</span>
          <span className="text-white/70 font-medium">12 / 25</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
            style={{ width: '48%' }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Clock className="w-3 h-3" />
          <span>Resets in 8h 24m</span>
        </div>
      </div>
    </div>
  );
}
