import { useState } from 'react';
import { 
  MessageSquarePlus, 
  Search, 
  FolderOpen, 
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Sparkles
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

interface Project {
  id: string;
  name: string;
}

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatSidebar({
  conversations = [],
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

  const projects: Project[] = []; // Empty for now

  // Collapsed state
  if (isCollapsed) {
    return (
      <div className="w-14 h-screen bg-[hsl(220,15%,8%)] border-r border-white/[0.06] flex flex-col items-center py-4 gap-3">
        <button
          onClick={onToggleCollapse}
          className="p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors"
        >
          <PanelLeft className="w-5 h-5 text-white/50" />
        </button>
        <div className="w-8 h-px bg-white/[0.06]" />
        <button
          onClick={onNewChat}
          className="p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors"
          title="New chat"
        >
          <MessageSquarePlus className="w-5 h-5 text-white/50" />
        </button>
        <button
          className="p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5 text-white/50" />
        </button>
        <button
          className="p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors"
          title="Projects"
        >
          <FolderOpen className="w-5 h-5 text-white/50" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 h-screen bg-[hsl(220,15%,8%)] border-r border-white/[0.06] flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white/90 text-[15px] tracking-tight">Stax AI</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <PanelLeftClose className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all text-white/80 group"
        >
          <MessageSquarePlus className="w-[18px] h-[18px] text-white/50 group-hover:text-white/70 transition-colors" />
          <span className="text-[14px] font-medium">New chat</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="pl-10 h-10 bg-white/[0.03] border-white/[0.06] text-white/80 placeholder:text-white/30 text-[14px] rounded-xl focus:bg-white/[0.05] focus:border-white/[0.1] transition-colors"
          />
        </div>
      </div>

      <div className="w-full h-px bg-white/[0.06]" />

      {/* Scrollable content area */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Projects Section */}
          <div>
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="w-full flex items-center gap-2 px-2 py-2 text-[12px] font-medium text-white/40 hover:text-white/60 transition-colors uppercase tracking-wider"
            >
              {projectsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Past projects</span>
            </button>
            
            {projectsExpanded && (
              <div className="mt-2 px-2">
                {projects.length === 0 ? (
                  <div className="py-6 text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                      <FolderOpen className="w-5 h-5 text-white/20" />
                    </div>
                    <p className="text-[13px] text-white/30">Nothing to see here yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {projects.map(project => (
                      <button
                        key={project.id}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
                      >
                        <span className="truncate">{project.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/[0.06]" />

          {/* Chat History */}
          <div>
            <div className="px-2 py-2 text-[12px] font-medium text-white/40 uppercase tracking-wider">
              Chat history
            </div>
            
            <div className="mt-2 px-2">
              {filteredConversations.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                    <MessageSquarePlus className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-[13px] text-white/30">
                    {searchQuery ? 'No chats found' : 'Nothing to see here yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map(conversation => (
                    <button
                      key={conversation.id}
                      onClick={() => onSelectConversation(conversation.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] transition-colors text-left",
                        activeConversationId === conversation.id
                          ? "bg-white/[0.1] text-white"
                          : "text-white/60 hover:bg-white/[0.06] hover:text-white/80"
                      )}
                    >
                      <span className="truncate">{conversation.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer - Usage indicator */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-white/40 font-medium">Credits remaining</span>
          <span className="text-[12px] text-white/60 font-semibold">12 / 25</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" 
            style={{ width: '48%' }}
          />
        </div>
        <p className="mt-2 text-[11px] text-white/30">Resets in 8h 24m</p>
      </div>
    </div>
  );
}
