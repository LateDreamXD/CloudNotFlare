<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountsStore } from '@/stores/accountsStore';
import { open as openWindow } from '@/lib/window';
import { useFileDialog } from '@vueuse/core';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	TableEmpty,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Loader2Icon,
	MoreHorizontalIcon,
	ArchiveIcon,
	ArchiveRestoreIcon,
	ArrowLeftIcon,
	ArrowRightLeftIcon,
	CloudDownloadIcon,
	UserPlus2Icon,
	UserMinus2Icon,
	UserRoundPenIcon,
	UserRoundXIcon,
	User2Icon
} from 'lucide-vue-next';

const router = useRouter();
const accountsStore = useAccountsStore();

interface AccountInfo {
	name: string;
	zoneId: string;
}

const accounts = computed<AccountInfo[]>(() => {
	return Object.entries(accountsStore.accountList).map(([name, account]) => ({
		name,
		zoneId: account.zoneId,
	}));
});

const currentAccountName = computed(() => accountsStore.currentAccountName);

const renameDialogOpen = ref(false);
const renameTargetName = ref('');
const newName = ref('');

const deleteDialogState = reactive<{
	open: boolean;
	isAll: boolean;
	targetName: string | null;
	loading: boolean;
	confirm: Function;
}>({
	open: false,
	isAll: false,
	targetName: null,
	loading: false,
	confirm: () => {}
});

const openRenameDialog = (name: string) => {
	renameTargetName.value = name;
	newName.value = name;
	renameDialogOpen.value = true;
};

const openDeleteConfirm = (name: string) => {
	deleteDialogState.targetName = name;
	deleteDialogState.isAll = false;
	deleteDialogState.open = true;
	deleteDialogState.confirm = () => {
		accountsStore.removeAccount(name);
		deleteDialogState.open = false;
	}
};

const handleRename = () => {
	if (!newName.value.trim() || newName.value === renameTargetName.value) {
		renameDialogOpen.value = false;
		return;
	}
	if (accountsStore.renameAccount(renameTargetName.value, newName.value.trim())) {
		renameDialogOpen.value = false;
	} else {
		alert('重命名失败');
	}
};

const handleAddAccount = () => {
	openWindow('/login?add', { width: 800, height: 600 }, true);
};

const handleSwitchAccount = (name: string) => {
	accountsStore.setCurrent(name);
};

const handleClearAll = () => {
	deleteDialogState.open = true;
	deleteDialogState.isAll = true;
	deleteDialogState.confirm = () => {
		accountsStore.clearAccounts();
		router.replace('/login');
	}
};

const handleExportBackup = () => {
	const now = new Date().toISOString();
	const content = `~ CloudNotFlare Accounts Backup - ${now} ~
	${Object.entries(accountsStore.accountList).map(
		([name, account]) => `${name}\t${account.zoneId}\t${account.apiToken}`)
	.join('\n')}
~  ~`;
	const blob = new Blob([content], {type: 'text/plain'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `cnfas-backup-${now}.cnfas`;
	a.click();
	URL.revokeObjectURL(url);
	a.remove();
}

const handleRestoreBackup = () => {
	const { open, onChange } = useFileDialog({
		accept: '.cnfas',
		multiple: false,
	});
	onChange(files => {
		const file = files?.[0];
		console.log(files, file);
		if(!file) return;
		const reader = new FileReader();
		reader.readAsText(file, 'utf-8');
		reader.onload = () => {
			const lines = reader.result?.toString()?.split('\n');
			const added = ref(0);
			lines && lines.forEach(line => {
				line = line.trim();
				if(line.startsWith('~')) return;
				const [name, zoneId, apiToken] = line.split('\t');
				accountsStore.addAccount(name, {zoneId, apiToken}, true) && added.value++;
			});
			alert(`成功添加 ${added.value} 个账户`);
		}
	});
	open();
};
</script>

<template>
	<div class="container mx-auto p-6 space-y-6">
		<div class="flex items-center justify-between">
			<div class="flex gap-4 items-center">
				<Button variant="ghost" @click="$router.back()">
					<ArrowLeftIcon />
				</Button>
				<hgroup>
					<h1 class="text-3xl font-bold tracking-tight">用户中心</h1>
					<p class="text-muted-foreground">管理已登录的 CloudNotFlare 账户</p>
				</hgroup>
			</div>
			<div class="flex items-center gap-2">
				<DropdownMenu>
					<DropdownMenuTrigger as-child>
						<Button variant="outline">
							<ArchiveIcon />
							备份与恢复
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem @click="handleExportBackup">
							<CloudDownloadIcon />
							导出备份
						</DropdownMenuItem>
						<DropdownMenuItem @click="handleRestoreBackup">
							<ArchiveRestoreIcon />
							恢复备份
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<Button variant="destructive" @click="handleClearAll" :disabled="accounts.length === 0">
					<UserRoundXIcon />
					删除全部
				</Button>
				<Button @click="handleAddAccount">
					<UserPlus2Icon />
					添加账户
				</Button>
			</div>
		</div>

		<div class="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>账户名称</TableHead>
						<TableHead>区域 ID</TableHead>
						<TableHead>状态</TableHead>
						<TableHead class="text-right">操作</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow v-for="account in accounts" :key="account.name">
						<TableCell class="font-medium">
							<div class="flex items-center gap-2">
								<User2Icon class="h-4 w-4 text-muted-foreground" />
								{{ account.name }}
							</div>
						</TableCell>
						<TableCell class="font-mono text-sm text-muted-foreground">
							{{ account.zoneId }}
						</TableCell>
						<TableCell>
							<span v-if="account.name === currentAccountName"
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
								当前账户
							</span>
							<span v-else class="text-muted-foreground text-sm">-</span>
						</TableCell>
						<TableCell class="text-right">
							<DropdownMenu>
								<DropdownMenuTrigger as-child>
									<Button variant="ghost" size="sm" class="h-8 w-8 p-0">
										<MoreHorizontalIcon class="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem v-if="account.name !== currentAccountName"
										@click="handleSwitchAccount(account.name)">
										<ArrowRightLeftIcon />
										切换至此账户
									</DropdownMenuItem>
									<DropdownMenuItem @click="openRenameDialog(account.name)">
										<UserRoundPenIcon />
										重命名
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										@click="openDeleteConfirm(account.name)"
										class="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
										<UserMinus2Icon />
										删除
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>

		<Dialog v-model:open="renameDialogOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>重命名账户</DialogTitle>
					<DialogDescription>
						将账户「{{ renameTargetName }}」重命名为新名称。
					</DialogDescription>
				</DialogHeader>
				<div class="py-4">
					<div class="flex flex-col space-y-2">
						<Label for="new-name">新名称</Label>
						<Input id="new-name" v-model="newName" placeholder="输入新名称" />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" @click="renameDialogOpen = false">取消</Button>
					<Button @click="handleRename" :disabled="!newName.trim() || newName === renameTargetName">
						确认重命名
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<Dialog v-model:open="deleteDialogState.open">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>删除账户</DialogTitle>
					<DialogDescription>
						确定要删除{{ deleteDialogState.isAll? '所有账户' : `账户「${deleteDialogState.targetName}」` }}吗？此操作不可撤销。
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" @click="deleteDialogState.open = false">取消</Button>
					<Button variant="destructive" @click="deleteDialogState.confirm" :disabled="deleteDialogState.loading">
						<Loader2Icon v-if="deleteDialogState.loading" class="animate-spin" />
						确认删除
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
