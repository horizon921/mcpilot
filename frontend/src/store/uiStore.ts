import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ModalPayload<T = any> {
  type: string; // e.g., 'editProfile', 'confirmDelete', 'addApiKey'
  data?: T;   // Optional data to pass to the modal
}

export interface UIStoreState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean; // 新增：侧边栏折叠（极窄）状态
  activeModal: ModalPayload | null; // Represents the currently open modal and its data
  globalLoadingMessage: string | null; // For a global, non-blocking loading indicator
  isChatDetailPanelOpen: boolean; // For the right-hand chat detail/settings panel

  // --- Sidebar Actions ---
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // --- Modal Actions ---
  openModal: <T = any>(payload: ModalPayload<T>) => void;
  closeModal: () => void;

  // --- Global Loading Actions ---
  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;

  // --- Chat Detail Panel Actions ---
  toggleChatDetailPanel: () => void;
  setChatDetailPanelOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStoreState>()(
  devtools(
    (set, get) => ({
      isSidebarOpen: true, // Default to open, or false based on preference
      isSidebarCollapsed: false, // 默认不折叠
      activeModal: null,
      globalLoadingMessage: null,
      isChatDetailPanelOpen: false, // Default to closed

      // --- Sidebar Implementations ---
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      // --- Modal Implementations ---
      openModal: (payload) => set({ activeModal: payload }),
      closeModal: () => set({ activeModal: null }),

      // --- Global Loading Implementations ---
      showGlobalLoading: (message = "加载中...") => set({ globalLoadingMessage: message }),
      hideGlobalLoading: () => set({ globalLoadingMessage: null }),

      // --- Chat Detail Panel Implementations ---
      toggleChatDetailPanel: () => set((state) => ({ isChatDetailPanelOpen: !state.isChatDetailPanelOpen })),
      setChatDetailPanelOpen: (isOpen) => set({ isChatDetailPanelOpen: isOpen }),
    }),
    {
      name: 'mcpilot-ui-store',
    }
  )
);