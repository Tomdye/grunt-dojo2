import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as mockery from 'mockery';
import { stub } from 'sinon';
import { unloadTasks, loadModule } from 'grunt-dojo2/tests/unit/util';

let postCssUtil: any;
const postCssModulesStub = stub();
const postCssImportStub = stub();
const postCssNextStub = stub();
const resolveStub = stub().returns('');
const relativeStub = stub().returns('');
const basenameStub = stub().returns('');
const umdWrapperStub = stub().returns('');
const writeFileStub = stub();

registerSuite({
	name: 'tasks/util/postcss',

	setup() {
		const mocks = {
			'postcss-modules': postCssModulesStub,
			'postcss-import': postCssImportStub,
			'postcss-cssnext': postCssNextStub,
			'path': {
				'resolve': resolveStub,
				'relativeStub': relativeStub,
				'basename': basenameStub
			},
			'./umdWrapper': umdWrapperStub,
			'fs': {
				'writeFileSync': writeFileStub
			}
		};

		postCssUtil = loadModule('grunt-dojo2/tasks/util/postcss', mocks, false);
	},

	beforeEach() {
		postCssModulesStub.reset();
		postCssImportStub.reset();
		postCssNextStub.reset();
		resolveStub.reset();
		relativeStub.reset();
		basenameStub.reset();
		writeFileStub.reset();
	},

	teardown() {
		unloadTasks();
	},

	createProcessors: {
		'order'() {
			const processors = postCssUtil.createProcessors('', '');
			assert.isTrue(processors.length === 3);
			assert.equal(processors[0], postCssImportStub);
			assert.isTrue(postCssNextStub.calledOnce);
			assert.isTrue(postCssModulesStub.calledOnce);
			assert.isTrue(postCssNextStub.calledBefore(postCssModulesStub));
		},
		'auto prefixer browsers'() {
			postCssUtil.createProcessors('', '');
			assert.isTrue(postCssNextStub.calledOnce);
			assert.isTrue(postCssNextStub.calledWithMatch({
				features: {
					autoprefixer: {
						browsers: [
							'last 2 versions',
							'ie >= 11'
						]
					}
				}
			}));
		},
		'generate scoped name': {
			'generate localised scoped name for dev'() {
				postCssUtil.createProcessors('', '', false);
				assert.isTrue(postCssModulesStub.calledWithMatch({
					generateScopedName: '[name]__[local]__[hash:base64:5]'
				}));
			},
			'generate hash only scoped name for dist'() {
				postCssUtil.createProcessors('', '', true);
				assert.isTrue(postCssModulesStub.calledWithMatch({
					generateScopedName: '[hash:base64:8]'
				}));
			}
		},
		'getJSON': {
			'should create output file with .js extension'() {
				relativeStub.returns('');
				resolveStub.returnsArg(0);
				const getJSON = (<any> postCssModulesStub.args[0]).getJSON;
				const cssFileName = 'testFileName.m.css';
				const jsonParam = {};

				getJSON(cssFileName, jsonParam);
				assert.isTrue(writeFileStub.calledOnce);
				assert.isTrue(writeFileStub.firstCall.calledWithMatch(cssFileName + '.js', {}));
			}
		}
	}
});
