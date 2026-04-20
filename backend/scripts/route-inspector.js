const express = require('express');

// Helper to inspect all registered routes
function listRoutes(app) {
  const routes = [];
  
  function extractRoutes(middleware, prefix = '') {
    if (middleware.router) {
      middleware.router.stack.forEach(layer => {
        if (layer.route) {
          // Direct route
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          routes.push({
            method: methods,
            path: prefix + layer.route.path,
            middleware: layer.route.stack.length > 1 ? 'Protected' : 'Public'
          });
        } else if (layer.name === 'router') {
          // Nested router
          const nestedPrefix = prefix + (layer.regexp.source.match(/^\/\^\\?\/?(.*)\\?\$?\$$/) || ['', ''])[1].replace(/\\\//g, '/').replace(/\$.*/, '');
          extractRoutes(layer.handle, nestedPrefix);
        }
      });
    }
  }

  // Extract routes from main app
  app._router.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      routes.push({
        method: methods,
        path: layer.route.path,
        middleware: 'Direct'
      });
    } else if (layer.regexp && layer.handle && layer.handle.router) {
      // Extract mount path from regex
      const mountPath = layer.regexp.source.match(/^\/\^\\?\/?(.*)\\?\$?\$$/) || ['', ''];
      const prefix = '/' + mountPath[1].replace(/\\\//g, '/').replace(/\$.*/, '');
      extractRoutes(layer.handle, prefix);
    }
  });

  return routes;
}

// Example usage - add this to your server.js after route setup
function logAllRoutes(app) {
  const routes = listRoutes(app);
  console.log('\n=== REGISTERED ROUTES ===');
  routes.forEach(route => {
    console.log(`${route.method.padEnd(8)} ${route.path.padEnd(35)} [${route.middleware}]`);
  });
  console.log('========================\n');
}

module.exports = { listRoutes, logAllRoutes };