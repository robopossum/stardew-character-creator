import ghpages from 'gh-pages';

ghpages.publish(
  'public',
  {
    branch: 'gh-pages',
    repo: 'https://github.com/robopossum/stardew-character-creator.git',
    user: {
      name: 'robopossum'
    }
  },
  () => console.log('Deploy Complete!')
);
