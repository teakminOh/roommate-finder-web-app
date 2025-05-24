<template>
  <div class="min-h-screen -mt-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold text-blue-800 mb-4">
          
            Správy
          
        </h1>
  
      </div>

      <!-- Main Chat Container -->
      <div class="max-w-7xl mx-auto">
        <div class="glass-effect rounded-3xl chat-shadow overflow-hidden">
          <div class="flex flex-col lg:flex-row ">
            
            <!-- Chat List Sidebar -->
            <div class="lg:w-96 bg-white/50 backdrop-blur-sm border-r border-white/20">
              <!-- Sidebar Header -->
              <div class="p-6 border-b border-white/20">
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-semibold text-gray-800">Chaty</h2>
                 
                </div>
                
                <!-- Search Bar -->
               
              </div>

              <!-- Chat List -->
              <div class="overflow-y-auto h-full pb-20">
                <!-- Loading State -->
                <div v-if="isLoading" class="flex items-center justify-center py-12">
                  <div class="relative">
                    <div class="w-12 h-12 rounded-full border-4 border-blue-500/20"></div>
                    <div class="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0"></div>
                  </div>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="p-6">
                  <div class="bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-700 p-4 rounded-2xl">
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                      {{ error }}
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="displayableChats.length === 0" class="text-center py-12 px-6">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                    </svg>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-700 mb-2">Zatiaľ žiadne správy</h3>
                  
                </div>

                <!-- Chat List -->
                <div v-else class="p-4 space-y-2">
                  <div
                    v-for="(chat, index) in displayableChats"
                    :key="chat.chatId"
                    @click="goToChat(chat)"
                    class="chat-item hover-lift p-4 rounded-2xl cursor-pointer transition-all duration-200 slide-in"
                    :class="{
                      'bg-white/60 ring-2 ring-blue-500/50': selectedChatUserId === chat.otherParticipant?.id,
                      'bg-white/30 hover:bg-white/50': selectedChatUserId !== chat.otherParticipant?.id
                    }"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    <div class="flex items-center space-x-4">
                      <div class="relative">
                        <!-- Avatar with Image -->
                        <img 
                          v-if="chat.otherParticipant?.profileImage" 
                          :src="chat.otherParticipant.profileImage" 
                          :alt="chat.otherParticipant?.firstName"
                          class="w-14 h-14 rounded-full object-cover ring-2 ring-white/50"
                        >
                        <!-- Avatar Fallback -->
                        <div 
                          v-else 
                          class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xl font-semibold text-white ring-2 ring-white/50"
                        >
                          {{ chat.otherParticipant?.firstName ? chat.otherParticipant.firstName.charAt(0).toUpperCase() : '?' }}
                        </div>
                        <!-- Status Indicator -->
                        
                      </div>
                      
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <h3 class="font-semibold text-gray-800 truncate">
                            {{ chat.otherParticipant?.firstName || 'Unknown User' }}
                          </h3>
                          <span 
                            v-if="chat.lastMessageTimestamp" 
                            class="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full ml-2"
                          >
                            {{ formatTime(chat.lastMessageTimestamp) }}
                          </span>
                        </div>
                        
                        <p class="text-sm text-gray-600 truncate mt-1">
                          {{ chat.lastMessageText || 'No messages yet' }}
                        </p>
                      </div>
                      
                      <!-- Unread indicator -->
                      <div v-if="hasUnreadMessages(chat)" class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Window -->
            <div class="flex-1 flex flex-col bg-white/30 h-full">
              <!-- Selected Chat Content -->
              <div v-if="user && selectedChatUserId" class=" flex flex-col">
                <!-- Chat Header -->
                <div class="p-6 border-b border-white/20 bg-white/20">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <img 
                        v-if="selectedChatInfo?.profileImage" 
                        :src="selectedChatInfo.profileImage" 
                        :alt="selectedChatInfo?.firstName"
                        class="w-12 h-12 rounded-full object-cover ring-2 ring-white/50"
                      >
                      <div 
                        v-else 
                        class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-lg font-semibold text-white ring-2 ring-white/50"
                      >
                        {{ selectedChatInfo?.firstName ? selectedChatInfo.firstName.charAt(0).toUpperCase() : '?' }}
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-800">{{ selectedChatInfo?.firstName || 'Unknown User' }}</h3>
                        
                      </div>
                    </div>
                    
                  </div>
                </div>

                <!-- ChatWindow Component -->
                <div class="flex-1 overflow-hidden">
                  <ChatWindow
                    :key="selectedChatUserId"
                    :other-user-id="selectedChatUserId"
                    class="h-full chat-window-custom"
                  />
                </div>
              </div>
              
              <!-- No Chat Selected -->
              <div v-else-if="user && !selectedChatUserId && !isLoading" class="h-full flex items-center justify-center">
                <div class="text-center p-6">
                  <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                 
                </div>
              </div>
              
              <!-- Not Logged In -->
        
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue';
import { useCurrentUser, useFirestore, useCollection } from 'vuefire';
import {
  collection, query, where, orderBy, limit, documentId, getDocs,
  type DocumentData
} from 'firebase/firestore';
import { useRouter } from 'vue-router';
import ChatWindow from '../components/ChatWindow.vue';

// Core interfaces
interface ChatMetadata {
  uids: string[];
  lastMessageText?: string | null;
  lastMessageTimestamp?: any | null;
}

interface FirestoreDocument<T> extends DocumentData {
  id: string;
}

type ChatDocument = FirestoreDocument<ChatMetadata>;

interface ChatParticipantInfo {
  id: string;
  firstName?: string;
  profileImage?: string | null;
}

interface ChatListItem {
  chatId: string;
  otherParticipant: ChatParticipantInfo | null;
  lastMessageText?: string | null;
  lastMessageTimestamp?: any | null;
}

// State management
const isLoading = ref(true);
const error = ref<string | null>(null);
const displayableChats = shallowRef<ChatListItem[]>([]);
const participantCache = ref<Record<string, ChatParticipantInfo | null>>({});
const isChatPanelOpen = ref(true);
const selectedChatUserId = ref<string | null>(null);

// Firebase & Router setup
const user = useCurrentUser();
const db = useFirestore();
const router = useRouter();

// Computed property for selected chat info
const selectedChatInfo = computed(() => {
  if (!selectedChatUserId.value) return null;
  return participantCache.value[selectedChatUserId.value];
});

// Dynamic query based on current user
const chatsQuery = computed(() => {
  if (!user.value?.uid) return null;
  
  return query(
    collection(db, 'chats'),
    where('uids', 'array-contains', user.value.uid),
    orderBy('lastMessageTimestamp', 'desc'),
    limit(25)
  );
});

// Reactive chat collection
const { data: rawChats, pending: chatsPending, error: chatsError } = useCollection(chatsQuery);

// Fetch profile data for chat participants
async function fetchParticipantProfiles(userIds: string[]): Promise<Record<string, ChatParticipantInfo | null>> {
  if (!userIds?.length) return {};
  
  const uniqueIds = [...new Set(userIds)];
  const profiles: Record<string, ChatParticipantInfo | null> = {};
  
  try {
    const q = query(collection(db, 'users'), where(documentId(), 'in', uniqueIds));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(doc => {
      if (doc.exists()) {
        const data = doc.data();
        let firstImage: string | null = null;
        if (Array.isArray(data.images) && data.images.length > 0 && typeof data.images[0] === 'string') {
            firstImage = data.images[0];
        }
        profiles[doc.id] = {
          id: doc.id,
          firstName: data.firstName ?? 'User',
          profileImage: firstImage,
        };
      }
    });
  } catch (e) {
    console.error('Error fetching profiles:', e);
  }
  
  return profiles;
}

// Process chat list updates
watch(rawChats, async (chats) => {
  if (!user.value) {
    displayableChats.value = [];
    return;
  }
  
  if (!chats) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const currentUserId = user.value.uid;
    const neededProfileIds = new Set<string>();
    const currentCache = { ...participantCache.value };
    
    chats.forEach((chat: any) => {
      const otherUserId = chat.uids?.find((id: string) => id !== currentUserId);
      if (otherUserId && !(otherUserId in currentCache)) {
        neededProfileIds.add(otherUserId);
      }
    });
    
    if (neededProfileIds.size > 0) {
      const newProfiles = await fetchParticipantProfiles(Array.from(neededProfileIds));
      participantCache.value = { ...currentCache, ...newProfiles };
    }
    
    const chatList: ChatListItem[] = [];
    (chats as ChatDocument[]).forEach((chat) => {
      if (chat?.uids && chat.lastMessageTimestamp) {
        const otherUserId = chat.uids.find((id: string) => id !== currentUserId);
        if (otherUserId) {
             const participantInfo = participantCache.value[otherUserId];
             if (participantInfo) {
                  chatList.push({
                      chatId: chat.id,
                      otherParticipant: participantInfo,
                      lastMessageText: chat.lastMessageText,
                      lastMessageTimestamp: chat.lastMessageTimestamp
                  });
             }
        }
      }
    });
    
    displayableChats.value = chatList;
    
    if (chatList.length > 0 && !selectedChatUserId.value) {
      selectedChatUserId.value = chatList[0].otherParticipant?.id || null;
    }
    
  } catch (err: any) {
    error.value = `Failed to load chats: ${err.message || 'Unknown error'}`;
    console.error("Error processing chats:", err);
  } finally {
    isLoading.value = false;
  }
}, { deep: true });

// Update loading state
watch(chatsPending, (pending) => {
  if (pending && displayableChats.value.length === 0) {
    isLoading.value = true;
  }
});

// Handle errors
watch(chatsError, (err) => {
  if (err) {
    error.value = "Error loading chat list.";
    isLoading.value = false;
  }
});

// Format timestamp for display
function formatTime(timestamp: any): string {
  if (!timestamp?.toDate) return '';
  
  const date = timestamp.toDate();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  if (messageDate >= weekAgo) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Function to select a chat
function goToChat(chatItem: ChatListItem) {
  if (chatItem.otherParticipant?.id) {
    selectedChatUserId.value = chatItem.otherParticipant.id;
    isChatPanelOpen.value = true;
  }
}

// Helper function to check unread messages (you can implement this logic)
function hasUnreadMessages(chat: ChatListItem): boolean {
  // Implement your unread message logic here
  // For now, return false as placeholder
  return Math.random() > 0.7; // Random for demo purposes
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.chat-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Inter', sans-serif;
}

.glass-effect {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.chat-shadow {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}



.slide-in {
  animation: slideIn 0.4s ease-out;
}



.chat-item {
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.chat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease-in-out;
}

.chat-item:hover::before {
  left: 100%;
}

.status-indicator {
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
  position: absolute;
  bottom: 2px;
  right: 2px;
}

/* Custom styles for ChatWindow component */
:deep(.chat-window-custom) {
  background: transparent;
}

:deep(.chat-window-custom .message-input) {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
}

:deep(.chat-window-custom .message-bubble) {
  backdrop-filter: blur(5px);
}
</style>