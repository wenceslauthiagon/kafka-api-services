const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');

const gitRevisionPlugin = new GitRevisionPlugin({ branch: true });

const buildInfo = {
  package: {
    version: JSON.stringify(require('./package.json').version),
    name: JSON.stringify(require('./package.json').author.name),
    email: JSON.stringify(require('./package.json').author.email),
    url: JSON.stringify(require('./package.json').author.url),
  },
};

console.log('Build Info');
console.log('Package version: ' + buildInfo.package.version);

try {
  buildInfo.git = {
    version: JSON.stringify(gitRevisionPlugin.version()),
    commitHash: JSON.stringify(gitRevisionPlugin.commithash()),
    branch: JSON.stringify(gitRevisionPlugin.branch()),
    lastCommitDatetime: JSON.stringify(gitRevisionPlugin.lastcommitdatetime()),
  };

  console.log('Git version: ' + buildInfo.git.version);
  console.log('Git commit: ' + buildInfo.git.commitHash);
  console.log('Git branch: ' + buildInfo.git.branch);
  console.log('Git timestamp: ' + buildInfo.git.lastCommitDatetime);
} catch (e) {
  // Bypass error when .git path is not found.
}

module.exports = {
  devtool: 'source-map',
  plugins: [
    new CopyPlugin({
      patterns: [{ from: 'apps/**/assets/**' }],
      options: { concurrency: 100 },
    }),
    new DefinePlugin({ _BUILD_INFO_: buildInfo }),
  ],
};
