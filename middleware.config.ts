export const config = {
  runtime: 'nodejs',
  unstable_allowDynamic: [
    '/node_modules/rate-limiter-flexible/**',
    '/node_modules/scheduler/**',
    '/node_modules/@clerk/shared/**',
  ],
}
