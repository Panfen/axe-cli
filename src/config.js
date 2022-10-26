/**
 * 一般rc(运行控制)类型的配置文件都是ini格式，如：
 * repo=axe-cli
 * register=github
 */ 


const fs = require('fs');
const { encode, decode } = require('ini'); 
const { defaultConfig, configFile } = require('./utils/constants');

module.exports = (action, k, v) => {

	const flag = fs.existsSync(configFile);
	const obj = {}

	if (flag) { // 配置文件存在
		const content = fs.readFileSync(configFile, 'utf8');
		const c = decode(content); // 将文件解析成对象
		Object.assign(obj, c);
	}

	if (action === 'get') {
		console.log(obj[k] || defaultConfig[k]);
	} else if (action === 'set') {
		obj[k] = v;
		fs.writeFileSync(configFile, encode(obj)); // 将内容转化成ini格式后写入文件
		console.log(`${k}=${v}`);
	} else if (action === 'getVal') {
		return obj[k];
	}
}