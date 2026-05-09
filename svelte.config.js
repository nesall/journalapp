import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      bodySize: 20 * 1024 * 1024 // 20 MB
    }),
  }
};

export default config;
