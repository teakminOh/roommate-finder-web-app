// plugins/vue-toastification.client.js
import { defineNuxtPlugin } from '#app';
import Toast, { POSITION } from 'vue-toastification';

// Import the CSS or use your own styling
import 'vue-toastification/dist/index.css';

export default defineNuxtPlugin(nuxtApp => {
    const options = {
        // You can set your default options here
        position: POSITION.TOP_RIGHT,
        timeout: 3000, // 3 seconds
        closeOnClick: true,
        pauseOnFocusLoss: true,
        pauseOnHover: true,
        draggable: true,
        draggablePercent: 0.6,
        showCloseButtonOnHover: false,
        hideProgressBar: false,
        closeButton: "button",
        icon: true,
        rtl: false
    };

    nuxtApp.vueApp.use(Toast, options);
});