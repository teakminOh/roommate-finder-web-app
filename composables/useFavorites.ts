// import { ref } from 'vue'
// import { useFirestore, useCollection, useCurrentUser } from 'vuefire'
// import { collection, doc, query, where, setDoc, deleteDoc } from 'firebase/firestore'

// export interface Property {
//   title: string;
//   fullDescription: string;
//   price: string;
//   images: string[];
// }

// export function useFavorites() {
//   const user = useCurrentUser()
//   const db = useFirestore()
  
//   if (!user.value) {
//     return {
//       favorites: ref([]),
//       addFavorite: () => {},
//       removeFavorite: () => {},
//       isFavorited: () => false
//     }
//   }
//   const favorites = useCollection(
//     query(
//       collection(db, 'favorites'),
//       where('userId', '==', user.value?.uid || 'none')
//     ),
//     { ssrKey: 'my-favs' }
//   )

//   // Add a property to favorites
//   const addFavorite = async (property: Property) => {
//     if (!user.value) {
//       return false;
//     }

//     try {
//       const favoritesRef = collection(db, 'favorites');
//       await setDoc(doc(favoritesRef, `${user.value.uid}_${property.title}`), {
//         userId: user.value.uid,
//         property,
//         createdAt: new Date()
//       });
//     } catch (error) {
//       console.error('Error adding favorite:', error);
//     }
//   }

//   // Remove a property from favorites
//   const removeFavorite = async (property: Property) => {
//     if (!user.value) return;

//     try {
//       const favoriteRef = doc(db, 'favorites', `${user.value.uid}_${property.title}`);
//       await deleteDoc(favoriteRef);
//     } catch (error) {
//       console.error('Error removing favorite:', error);
//     }
//   }

//   // Check if a property is favorited
//   const isFavorited = (property: Property) => {
//     return favorites.value?.some(fav => fav.property.title === property.title) ?? false;
//   }

//   return {
//     favorites,
//     addFavorite,
//     removeFavorite,
//     isFavorited
//   }
// } 

import { ref } from 'vue'
import { useFirestore, useCollection, useCurrentUser } from 'vuefire'
import { collection, doc, query, where, setDoc, deleteDoc } from 'firebase/firestore'

export interface Roommate {
  firstName: string;
  bio: string;
  budget: string;
  gender: string;
  images: string[];
}

export function useFavorites() {
  const user = useCurrentUser()
  const db = useFirestore()
  
  if (!user.value) {
    return {
      favorites: ref([]),
      addFavorite: () => {},
      removeFavorite: () => {},
      isFavorited: () => false
    }
  }
  const favorites = useCollection(
    query(
      collection(db, 'favorites'),
      where('userId', '==', user.value?.uid || 'none')
    ),
    { ssrKey: 'my-favs' }
  )

  // Add a property to favorites
  const addFavorite = async (roommate: Roommate) => {
    if (!user.value) {
      return false;
    }

    try {
      const favoritesRef = collection(db, 'favorites');
      await setDoc(doc(favoritesRef, `${user.value.uid}_${roommate.firstName}`), {
        userId: user.value.uid,
        roommate,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  }

  // Remove a roommate from favorites
  const removeFavorite = async (roommate: Roommate) => {
    if (!user.value) return;

    try {
      const favoriteRef = doc(db, 'favorites', `${user.value.uid}_${roommate.firstName}`);
      await deleteDoc(favoriteRef);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  // Check if a roommate is favorited
  const isFavorited = (roommate: Roommate) => {
    return favorites.value?.some(fav => fav.roommate.firstName === roommate.firstName) ?? false;
  }

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorited
  }
} 