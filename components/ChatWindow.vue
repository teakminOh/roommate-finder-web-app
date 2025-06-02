<template>
  <!-- Outer container with responsive height and padding -->
  <div class="flex flex-col h-[calc(100vh-2rem)] sm:h-[500px] md:h-[600px] lg:h-[700px] 
              mx-2 sm:mx-4 md:mx-0 border border-gray-200 rounded-lg shadow-md overflow-hidden bg-white">

    <!-- Header (Optional) with responsive text -->
    <div v-if="chatId" class="px-3 py-2 sm:p-3 border-b border-gray-200 text-center font-semibold bg-gray-50 flex-shrink-0">
      <span class="text-sm sm:text-base">Chatuj s používateľom {{ props.otherUserName }}</span>
    </div>
    <div v-else class="px-3 py-2 sm:p-3 text-center text-gray-500">
      <span class="text-sm sm:text-base">Prihlás sa ako spolubývajúci, aby si mohol chatovať!</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && messages.length === 0" class="flex-grow flex items-center justify-center text-gray-500 px-4">
      <span class="text-sm sm:text-base">Načítavanie správ...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-grow flex items-center justify-center text-red-600 p-4">
      <span class="text-sm sm:text-base text-center">Error: {{ error }}</span>
    </div>

    <!-- Message List Area with responsive padding -->
    <div
      v-else-if="chatId"
      ref="chatContainer"
      class="flex-grow overflow-y-auto px-2 py-3 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50"
    >
      <!-- No Messages Placeholder -->
      <p v-if="!isLoading && messages.length === 0" class="text-center text-gray-400 italic mt-4 text-sm sm:text-base px-4">
        Žiadne správy na zobrazenie. Začni konverzáciu!
      </p>
      
      <!-- Individual Messages with responsive sizing -->
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex"
        :class="[message.senderId === user?.uid ? 'justify-end' : 'justify-start']"
      >
        <div
          class="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[60%] 
                 px-3 py-2 rounded-xl shadow-sm"
          :class="[
            message.senderId === user?.uid 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
          ]"
        >
          <p class="text-sm sm:text-base break-words leading-relaxed">{{ message.text }}</p>
          <span class="text-xs mt-1 block text-right opacity-70">
            {{ message.displayTime }}
          </span>
        </div>
      </div>
    </div>

    <!-- Input Area with responsive layout -->
    <form
      v-if="chatId && !error"
      @submit.prevent="sendMessage"
      class="p-2 sm:p-3 border-t border-gray-200 bg-gray-100 flex items-end gap-2 flex-shrink-0"
    >
      <!-- Input wrapper for better mobile experience -->
      <div class="flex-grow relative">
        <textarea
          v-model="newMessageText"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="newMessageText += '\n'"
          placeholder="Napíš správu..."
          rows="1"
          class="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-2xl 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent 
                 transition duration-200 text-sm sm:text-base resize-none overflow-hidden
                 max-h-24 sm:max-h-32"
          :disabled="!user"
          ref="messageInput"
        ></textarea>
        
        <!-- Character count for mobile (optional) -->
        <div v-if="newMessageText.length > 200" 
             class="absolute -top-6 right-2 text-xs text-gray-500 sm:hidden">
          {{ newMessageText.length }}/500
        </div>
      </div>
      
      <!-- Send button with responsive sizing -->
      <button
        type="submit"
        :disabled="!newMessageText.trim() || !user"
        class="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-500 text-white rounded-2xl 
               hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 
               focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed 
               transition duration-200 flex-shrink-0 min-w-[60px] sm:min-w-[80px]
               flex items-center justify-center text-sm sm:text-base font-medium"
      >
        <!-- Icon for mobile, text for larger screens -->
        <span class="hidden sm:inline">Poslať</span>
        <svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
        </svg>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useCurrentUser, useFirestore, useCollection } from 'vuefire';
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  type Timestamp,
  type Query,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';

// --- Types ---
interface ChatMessageData {
  text: string;
  senderId: string;
  createdAt: Timestamp | null;
}

interface ChatMessage extends ChatMessageData {
  id: string;
  displayTime?: string;
}

// --- Props ---
const props = defineProps<{
  otherUserId: string;
  otherUserName?: string;
}>();

// --- State ---
const messages = ref<ChatMessage[]>([]);
const newMessageText = ref('');
const isLoading = ref(true);
const error = ref<string | null>(null);
const chatContainer = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLTextAreaElement | null>(null);

// --- Firebase ---
const user = useCurrentUser();
const db = useFirestore();

// --- Chat ID Calculation ---
const chatId = computed(() => {
  if (!user.value?.uid || !props.otherUserId || user.value.uid === props.otherUserId) {
    return null;
  }
  return [user.value.uid, props.otherUserId].sort().join('_');
});

// --- Auto-resize textarea ---
const autoResize = () => {
  if (messageInput.value) {
    messageInput.value.style.height = 'auto';
    messageInput.value.style.height = messageInput.value.scrollHeight + 'px';
  }
};

// Watch for text changes to auto-resize
watch(newMessageText, () => {
  nextTick(autoResize);
});

// --- Create Message Converter ---
const messageConverter: FirestoreDataConverter<ChatMessageData> = {
  toFirestore(message: ChatMessageData): DocumentData {
    return {
      text: message.text,
      senderId: message.senderId,
      createdAt: message.createdAt
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot
  ): ChatMessageData {
    const data = snapshot.data();
    return {
      text: data.text ?? '',
      senderId: data.senderId ?? '',
      createdAt: data.createdAt as Timestamp | null ?? null,
    };
  }
};

// --- Messages Query ---
const messagesQuery = ref<Query<ChatMessageData> | null>(null);

// --- Real-time Messages Collection ---
const {
  data: rawMessages,
  pending: messagesPending,
  error: messagesListenerError
} = useCollection<ChatMessageData>(messagesQuery, { wait: true });

// --- Ensure Chat Document Exists ---
async function ensureChatDocument(id: string): Promise<boolean> {
  if (!user.value) return false;
  
  try {
    const chatDocRef = doc(db, 'chats', id);
    const docSnap = await getDoc(chatDocRef);
    
    if (!docSnap.exists()) {
      await setDoc(chatDocRef, {
        uids: [user.value.uid, props.otherUserId].sort(),
        lastMessageText: null,
        lastMessageTimestamp: null,
      });
      console.log(`Created new chat document: ${id}`);
    } else {
      const data = docSnap.data();
      if (!data?.uids?.includes(user.value.uid)) {
        console.error(`User ${user.value.uid} not in chat document uids:`, data?.uids);
        error.value = "Chat permission mismatch.";
        return false;
      }
    }
    return true;
  } catch (err: any) {
    console.error("Chat document check/create error:", err);
    error.value = `Could not initialize chat: ${err.message}`;
    return false;
  }
}

// --- Initialize Chat When chatId Changes ---
watch(chatId, async (newChatId) => {
  error.value = null;
  messages.value = [];
  messagesQuery.value = null;
  
  if (!newChatId) {
    isLoading.value = false;
    return;
  }
  
  isLoading.value = true;
  console.log(`Setting up chat with ID: ${newChatId}`);
  
  if (await ensureChatDocument(newChatId)) {
    try {
      const messagesColRef = collection(db, 'chats', newChatId, 'messages')
        .withConverter(messageConverter);
        
      messagesQuery.value = query(
        messagesColRef,
        orderBy('createdAt', 'asc'),
        limit(100)
      );
    } catch (err: any) {
      console.error("Error setting up messages query:", err);
      error.value = `Could not load messages: ${err.message}`;
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
  }
}, { immediate: true });

// --- Process Messages ---
watch([rawMessages, messagesPending, messagesListenerError], 
  ([newMessages, pending, listenerError]) => {
    isLoading.value = pending && messagesQuery.value !== null;
    
    if (listenerError) {
      console.error("Messages listener error:", listenerError);
      error.value = `Failed to load messages: ${listenerError.message}`;
      isLoading.value = false;
    }
    
    if (newMessages) {
      messages.value = newMessages.map(msg => {
        let displayTime = 'Sending...';
        if (msg.createdAt?.toDate) {
          try {
            displayTime = msg.createdAt.toDate().toLocaleTimeString([], { 
              hour: 'numeric', 
              minute: '2-digit'
            });
          } catch (e) {
            displayTime = 'Invalid Date';
          }
        }
        
        return {
          id: (msg as any).id,
          text: msg.text,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          displayTime
        };
      });
      
      nextTick(() => {
        if (chatContainer.value) {
          chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
      });
    }
  }, { immediate: true, deep: true }
);

// --- Send Message Logic ---
const sendMessage = async () => {
  const trimmedText = newMessageText.value.trim();
  if (!trimmedText || !user.value || !chatId.value) return;
  
  newMessageText.value = '';
  
  try {
    const chatDocRef = doc(db, 'chats', chatId.value);
    const messagesColRef = collection(db, 'chats', chatId.value, 'messages');
    
    await setDoc(chatDocRef, { 
      uids: [user.value.uid, props.otherUserId].sort() 
    }, { merge: true });
    
    await addDoc(messagesColRef, {
      text: trimmedText,
      senderId: user.value.uid,
      createdAt: serverTimestamp()
    });
    
    await setDoc(chatDocRef, {
      lastMessageText: trimmedText,
      lastMessageTimestamp: serverTimestamp()
    }, { merge: true });
    
    console.log("Message sent successfully");
  } catch (e: any) {
    console.error("Send message error:", e);
    error.value = `Failed to send message: ${e.message}`;
    newMessageText.value = trimmedText;
  }
};

// --- Initialize textarea resize on mount ---
onMounted(() => {
  if (messageInput.value) {
    messageInput.value.addEventListener('input', autoResize);
  }
});
</script>