/**
 * 参考：https://juejin.cn/post/7142323369894445063
 */ 

const program = require('commander')
const path  = require('path')
const { version } = require('./utils/constants');

const actionsMap = {
	create: {
		description: 'create project',
		alias: 'cp',
		examples: [
			'axe-cli create <template-name>'
		],
	},
	config: {
		description: 'config info',
		alias: 'ci',
		examples: [
			'axe-cli config get <k>',
			'axe-cli config set <k> <v>'
		],
	},
	'*': {
		alias: 'none',
		description: 'command not found'
	}
}

// 循环创建命令
Object.keys(actionsMap).forEach(action => {
	program
		.command(action) // 命令的名称
		.alias(actionsMap[action].alias) // 命令的别名
		.description(actionsMap[action].description) // 命令的描述
		.action(() => { // 动作
			if (action === '*') {
				console.log(actionsMap[action].description)
			} else {
				require(path.resolve(__dirname, action))(...process.argv.slice(3))
			}
		})
})

program.on('--help', () => {
	console.log('Examples:')
	Object.keys(actionsMap).forEach((action) => {
		(actionsMap[action].examples || []).forEach((example) => {
			console.log(` ${example}`);
		});
	});
});

program.version(version)
	.parse(process.argv) // // process.argv就是用户在命令行中传入的参数