export function getServiceAddress() {
  return (
    localStorage.getItem('__PRODUCTION__APP__CONF__API_BASE_URL') ||
    (window as any).__PRODUCTION__APP__CONF__?.VITE_APP_API_BASEURL ||
    import.meta.env?.VITE_APP_API_BASEURL
  )
}
