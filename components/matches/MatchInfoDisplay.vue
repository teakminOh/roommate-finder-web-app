<!-- components/MatchInfoDisplay.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { UserUserMatch, UserRoomMatch } from '~/functions/src/interfaces'; // Adjust path

// Define props using a union type if needed, or keep it simple if structure is consistent
const props = defineProps<{
  matchData: Omit<UserUserMatch, 'uids' | 'type' | 'updatedAt'> | Omit<UserRoomMatch, 'userId' | 'roomId' | 'type' | 'updatedAt'> & { score: number; distance?: number | null };
}>();

// Helper to format distance nicely
const formattedDistance = computed(() => {
  const dist = props.matchData.distance;
  if (dist === null || dist === undefined) {
    return null; // Don't display if null/undefined
  }
  if (dist < 1000) {
    return `${dist}m`;
  } else {
    return `${(dist / 1000).toFixed(1)}km`;
  }
});

// Calculate score percentage (assume max score is 100)
const scorePercentage = computed(() => {
  const score = props.matchData.score ?? 0;
  return Math.min(Math.max(score, 0), 100); // Ensure between 0-100
});

// Determine the color based on the score
const barColor = computed(() => {
  const score = scorePercentage.value;
  
  if (score >= 90) return 'bg-green-500'; // Excellent match
  if (score >= 70) return 'bg-green-400'; // Good match
  if (score >= 60) return 'bg-yellow-400'; // Decent match
  if (score >= 50) return 'bg-orange-400'; // Fair match
  return 'bg-orange-500'; // Poor match
});

// Format the score as a readable number
const formattedScore = computed(() => {
  return props.matchData.score?.toFixed(0) ?? 'N/A';
});

// Calculate width style for the progress bar
const barWidth = computed(() => {
  return `${scorePercentage.value}%`;
});
</script>

<template>
  <div class="mt-3 px-1 pb-2">
    <div class="flex items-center justify-between mb-1 text-sm">
      <span class="font-medium text-gray-700">Skóre</span>
      <div class="flex items-center">
        <span class="font-semibold text-gray-800">{{ formattedScore }}</span>
        <span v-if="formattedDistance" class="ml-2 text-gray-500 text-xs">
          (~{{ formattedDistance }})
        </span>
      </div>
    </div>
    
    <!-- Score Progress Bar -->
    <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div 
        :class="[barColor, 'h-2.5 rounded-full transition-all duration-500']" 
        :style="{ width: barWidth }"
      ></div>
    </div>
    
    <!-- Match Quality Indicator -->
    <div class="mt-1 text-xs text-right">
      <span 
        :class="{
          'text-green-600': scorePercentage >= 90,
          'text-green-500': scorePercentage >= 70 && scorePercentage < 90,
          'text-yellow-500': scorePercentage >= 60 && scorePercentage < 70,
          'text-orange-500': scorePercentage < 60
        }"
      >
        {{ 
          scorePercentage >= 90 ? 'Výborné' : 
          scorePercentage >= 70 ? 'Super' : 
          scorePercentage >= 60 ? 'Dobrý' : 
          scorePercentage >= 50 ? 'Pohode' : 'Pohode'
        }}
      </span>
    </div>
  </div>
</template>