// vite.config.ts
import { defineConfig } from "file:///mnt/c/Users/NewAkash/wikisense/node_modules/vite/dist/node/index.js";
import react from "file:///mnt/c/Users/NewAkash/wikisense/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
import { viteStaticCopy } from "file:///mnt/c/Users/NewAkash/wikisense/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "/mnt/c/Users/NewAkash/wikisense/packages/extension";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "public/manifest.json", dest: "." },
        { src: "public/icons", dest: "." },
        { src: "src/content/content.css", dest: "." }
      ]
    })
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: mode === "development",
    minify: mode === "production" ? "esbuild" : false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__vite_injected_original_dirname, "src/sidepanel/index.html"),
        background: resolve(__vite_injected_original_dirname, "src/background/background.ts"),
        content: resolve(__vite_injected_original_dirname, "src/content/content.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      }
    }
  },
  resolve: {
    alias: {
      "@wikisense/shared": resolve(__vite_injected_original_dirname, "../shared/src"),
      "@wikisense/extension": resolve(__vite_injected_original_dirname, "src")
    }
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode)
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2MvVXNlcnMvTmV3QWthc2gvd2lraXNlbnNlL3BhY2thZ2VzL2V4dGVuc2lvblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21udC9jL1VzZXJzL05ld0FrYXNoL3dpa2lzZW5zZS9wYWNrYWdlcy9leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21udC9jL1VzZXJzL05ld0FrYXNoL3dpa2lzZW5zZS9wYWNrYWdlcy9leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5JztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgdml0ZVN0YXRpY0NvcHkoe1xuICAgICAgdGFyZ2V0czogW1xuICAgICAgICB7IHNyYzogJ3B1YmxpYy9tYW5pZmVzdC5qc29uJywgZGVzdDogJy4nIH0sXG4gICAgICAgIHsgc3JjOiAncHVibGljL2ljb25zJywgZGVzdDogJy4nIH0sXG4gICAgICAgIHsgc3JjOiAnc3JjL2NvbnRlbnQvY29udGVudC5jc3MnLCBkZXN0OiAnLicgfSxcbiAgICAgIF0sXG4gICAgfSksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxuICAgIG1pbmlmeTogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gJ2VzYnVpbGQnIDogZmFsc2UsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgc2lkZXBhbmVsOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9zaWRlcGFuZWwvaW5kZXguaHRtbCcpLFxuICAgICAgICBiYWNrZ3JvdW5kOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9iYWNrZ3JvdW5kL2JhY2tncm91bmQudHMnKSxcbiAgICAgICAgY29udGVudDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvY29udGVudC9jb250ZW50LnRzJyksXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJyxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdbbmFtZV0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ1tuYW1lXS5bZXh0XScsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0B3aWtpc2Vuc2Uvc2hhcmVkJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zaGFyZWQvc3JjJyksXG4gICAgICAnQHdpa2lzZW5zZS9leHRlbnNpb24nOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICB9LFxufSkpOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1UsU0FBUyxvQkFBb0I7QUFDclcsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUN4QixTQUFTLHNCQUFzQjtBQUgvQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGVBQWU7QUFBQSxNQUNiLFNBQVM7QUFBQSxRQUNQLEVBQUUsS0FBSyx3QkFBd0IsTUFBTSxJQUFJO0FBQUEsUUFDekMsRUFBRSxLQUFLLGdCQUFnQixNQUFNLElBQUk7QUFBQSxRQUNqQyxFQUFFLEtBQUssMkJBQTJCLE1BQU0sSUFBSTtBQUFBLE1BQzlDO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsV0FBVyxTQUFTO0FBQUEsSUFDcEIsUUFBUSxTQUFTLGVBQWUsWUFBWTtBQUFBLElBQzVDLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLFdBQVcsUUFBUSxrQ0FBVywwQkFBMEI7QUFBQSxRQUN4RCxZQUFZLFFBQVEsa0NBQVcsOEJBQThCO0FBQUEsUUFDN0QsU0FBUyxRQUFRLGtDQUFXLHdCQUF3QjtBQUFBLE1BQ3REO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxxQkFBcUIsUUFBUSxrQ0FBVyxlQUFlO0FBQUEsTUFDdkQsd0JBQXdCLFFBQVEsa0NBQVcsS0FBSztBQUFBLElBQ2xEO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sd0JBQXdCLEtBQUssVUFBVSxJQUFJO0FBQUEsRUFDN0M7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
