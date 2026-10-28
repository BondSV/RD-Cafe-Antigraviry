import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {proxy: {'/api/test-research':{target:'http://127.0.0.1:8092',rewrite:path=>path.replace('/api/test-research/','/api/research/')},'/api/research':'http://127.0.0.1:8091'}},
});
