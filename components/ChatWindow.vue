<template>
  <!-- Outer container -->
  <div class="flex flex-col h-[500px] md:h-[600px] border border-gray-200 rounded-lg shadow-md overflow-hidden bg-white">

    <!-- Header (Optional) -->
    <div v-if="chatId" class="p-3 border-b border-gray-200 text-center font-semibold bg-gray-50 flex-shrink-0">
      Chatuj s používateľom {{ props.otherUserName }} <!-- Replace with actual name if fetched -->
    </div>
    <div v-else class="p-3 text-center text-gray-500">
      Prihlás sa, aby si mohol chatovať!
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && messages.length === 0" class="flex-grow flex items-center justify-center text-gray-500">
      Načítavanie správ...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-grow flex items-center justify-center text-red-600 p-4">
      Error: {{ error }}
    </div>

    <!-- Message List Area -->
    <div
      v-else-if="chatId"
      ref="chatContainer"
      class="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50"
    >
      <!-- No Messages Placeholder -->
      <p v-if="!isLoading && messages.length === 0" class="text-center text-gray-400 italic mt-4">
        Žiadne správy na zobrazenie. Začni konverzáciu!
      </p>
      <!-- Individual Messages -->
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex"
        :class="[message.senderId === user?.uid ? 'justify-end' : 'justify-start']"
      >
        <div
          class="max-w-[70%] px-3 py-2 rounded-xl"
          :class="[message.senderId === user?.uid ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none']"
        >
          <p class="text-sm break-words">{{ message.text }}</p>
          <span class="text-xs mt-1 block text-right opacity-70">
            {{ message.displayTime }}
          </span>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <form
      v-if="chatId && !error"
      @submit.prevent="sendMessage"
      class="p-3 border-t border-gray-200 bg-gray-100 flex items-center gap-2 flex-shrink-0"
    >
      <input
        type="text"
        v-model="newMessageText"
        placeholder="Napíš správu..."
        class="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
        :disabled="!user"
      />
      <button
        type="submit"
        :disabled="!newMessageText.trim() || !user"
        class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex-shrink-0"
      >
        Poslať
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
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
  otherUserName?: string; // Optional, can be used for display purposes
}>();

// --- State ---
const messages = ref<ChatMessage[]>([]);
const newMessageText = ref('');
const isLoading = ref(true);
const error = ref<string | null>(null);
const chatContainer = ref<HTMLElement | null>(null);

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
      // Verify current user is in existing uids array
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
      // Set up messages query with the converter
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
    // Handle loading state
    isLoading.value = pending && messagesQuery.value !== null;
    
    // Handle errors
    if (listenerError) {
      console.error("Messages listener error:", listenerError);
      error.value = `Failed to load messages: ${listenerError.message}`;
      isLoading.value = false;
    }
    
    // Process messages
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
          id: (msg as any).id, // Add cast to handle id from useCollection
          text: msg.text,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          displayTime
        };
      });
      
      // Auto-scroll
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
    
    // Update chat document (ensures it exists)
    await setDoc(chatDocRef, { 
      uids: [user.value.uid, props.otherUserId].sort() 
    }, { merge: true });
    
    // Add message
    await addDoc(messagesColRef, {
      text: trimmedText,
      senderId: user.value.uid,
      createdAt: serverTimestamp()
    });
    
    // Update last message metadata
    await setDoc(chatDocRef, {
      lastMessageText: trimmedText,
      lastMessageTimestamp: serverTimestamp()
    }, { merge: true });
    
    console.log("Message sent successfully");
  } catch (e: any) {
    console.error("Send message error:", e);
    error.value = `Failed to send message: ${e.message}`;
    newMessageText.value = trimmedText; // Restore text on error
  }
};
</script>