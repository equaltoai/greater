export const onRequest = async (context) => {
  const { request, params } = context;
  const url = new URL(request.url);
  
  return new Response(JSON.stringify({
    message: "Test function is working",
    timestamp: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    params: params,
    headers: Object.fromEntries(request.headers.entries())
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};