const { name, version } = require('../../package.json');

const configFile = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.axerc`; // 配置文件的存储位置

const defaultConfig = {
	repo: 'axe-cli', // 默认拉取的仓库名
}

module.exports = {
	name,
	version,
	configFile,
	defaultConfig
}