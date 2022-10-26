/**
 * 创建项目
 */ 

const axios = require('axios');
const ora = require('ora');
const path  = require('path')
const inquirer  = require('inquirer');
const { promisify } = require('util');
const downloadGit = promisify(require('download-git-repo'))
const ncp = promisify(require('ncp').ncp)
const config = require('./config')

const repoUrl = config('getVal', 'repo'); // 获取配置变量


// 存放下载文件的目录：/Users/panjifei/.template
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;


// 获取仓库列表
const fetchRepoList = async () => {
	const { data } = await axios.get('https://api.github.com/users/Panfen/repos');
	return data;
}

// 获取版本信息
const fetchTagList = async (repo) => {
	const { data } = await axios.get(`https://api.github.com/repos/Panfen/${repo}/tags`);
	return data;
}

// 下载项目
const download = async (repo, tag) => {
	let api = `Panfen/${repo}`;
	if (tag) {
		api += `#/${tag}`;
	}
	const dest = `${downloadDirectory}/${repo}`;
	await downloadGit(api, dest);
	return dest; // 返回下载目录
}

// 封装fetch， 带loading 
const wrapFetchAddLoading = (fn, message) => async (...args) => {
	const spinner = ora(message);
	spinner.start();
	const res = await fn(...args);
	spinner.succeed();
	return res;
}


module.exports = async (programName) => {
	let repos = await wrapFetchAddLoading(fetchRepoList, 'fetching template list...')();
	repos = repos.map((repo) => repo.name)

	// 选择模板
	const { repo } = await inquirer.prompt({
		name: 'repo',
		type: 'list',
		message: 'Please choose repo template to create project',
		choices: repos
	})

	let tags = await wrapFetchAddLoading(fetchTagList, 'fetching template list...')(repo);
	tags = tags.map((tag) => tag.name)

	// 选择版本
	const { tag } = await inquirer.prompt({
		name: 'tag',
		type: 'list',
		message: 'Please choose tag template to create project',
		choices: tags
	})

	// 下载项目
	const target = await wrapFetchAddLoading(download, 'download template')(repo, tag)

	// 拷贝项目
	await ncp(target, path.join(path.resolve(), `/template/${repo}`));
}

