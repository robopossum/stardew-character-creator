const ghpages = require('gh-pages');

ghpages.publish(
  'public',
  {
    branch: 'svelte',
    repo: 'https://github.com/robopossum/stardew-character-creator.git',
    user: {
      name: 'robopossum'
    }
  },
  () => console.log('Deploy Complete!')
);
