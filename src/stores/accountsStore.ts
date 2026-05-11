import { defineStore } from 'pinia';

export const useAccountsStore = defineStore('accounts', {
	state: () => ({
		_num: 0,
		current: '',
		list: {} as Record<string, Account>
	}),
	actions: {
		setCurrent(name: string) {
			if(!this.list[name]) console.warn(`Account ${name} not found`);
			else {this.current = name; return true;}
		},
		addAccount(name: string, account: Account, overwrite = false) {
			if(this.list[name] && !overwrite) console.warn(`Account ${name} already exists`);
			else {this.list[name] = account; return true;}
		},
		removeAccount(name: string) {
			if(!this.list[name]) return;
			try {
				delete this.list[name];
				if(this.current === name) this.current = Object.keys(this.list)[0];
				return true;
			} catch(err) {
				console.error(`Error removing account ${name}:`, err);
				return false;
			}
		},
		renameAccount(oldName: string, newName: string) {
			if(!this.list[oldName]) console.warn(`Account ${oldName} is not exists`);
			else try {
				this.list[newName] = this.list[oldName];
				delete this.list[oldName];
				if(this.current === oldName) this.current = newName;
				return true;
			} catch(err) {
				console.error(`Error renaming account ${oldName} to ${newName}:`, err);
				return false;
			}
		},
		clearAccounts() {
			this.list = {};
			this.current = '';
			return true;
		}
	},
	getters: {
		num: (state) => state._num++,
		currentAccount: (state) => state.list[state.current],
		accountList: (state) => state.list,
	},
	persist: true,
});
