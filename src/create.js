/**
 * 创建项目
 */ 

const axios = require('axios');
const ora = require('ora');
const path  = require('path')
const fs = require('fs')
const inquirer  = require('inquirer');
const { promisify } = require('util');
const metalsmith = require('metalsmith'); // 遍历文件夹
let { render } = require('consolidate').ejs;
const downloadGit = promisify(require('download-git-repo'));
const ncp = promisify(require('ncp').ncp);

render = promisify(render);

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


module.exports = async (projectName = 'axe-cli-project') => {

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

	// 下载项目，返回下载路径（/Users/panjifei/.template/axe-cli-repo）
	const target = await wrapFetchAddLoading(download, 'download template')(repo, tag)

	// 没有ask文件说明不需要编译，直接拷贝，否则需要编译
	if (!fs.existsSync(path.join(target, 'ask.js'))) {
		// 拷贝项目
		await ncp(target, path.join(path.resolve(), projectName));
	} else {
		await new Promise((resolve, reject) => {
			metalsmith(__dirname)
				.source(target) // 遍历下载的目录
				.destination(path.join(path.resolve(), projectName)) // 输出渲染后的结果
				.use(async (files, metal, done) => {
					// 弹框询问用户
					const result = await inquirer.prompt(require(path.join(target, 'ask.js')));
					const data = metal.metadata();
					// 将询问结果放到metadata中保证在下一个中间件中可以获取
					Object.assign(data, result);
					delete files['ask.js'];
					done();
				})
				.use((files, metal, done) => {
					Reflect.ownKeys(files).forEach(async (file) => {
						// 获取文件中的内容
						let content = files[file].contents.toString();
						// 如果是js或json文件才有可能是模板
						if (file.includes('.js') || file.includes('.json')) {
							// 文件中包含‘<%’才需要编译
							if (content.includes('<%')) {
								// 用数据渲染模板
								content = await render(content, metal.metadata());
								// 渲染完成的数据替换原内容
								files[file].contents = Buffer.from(content);
							}
						}
					});
					done();
				})
				.build((err) => {
					if (!err) {
						resolve()
					} else {
						reject()
					}
				});
		});
	}
}

