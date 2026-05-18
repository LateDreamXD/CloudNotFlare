<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from '@/components/ui/alert';
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
	AlertCircleIcon,
	Loader2Icon,
	ServerIcon,
	ShieldIcon,
	GlobeIcon,
	ActivityIcon,
	ArrowUpRightIcon,
	MoreHorizontalIcon,
	UserPlus2Icon,
	Users2Icon,
	LogOutIcon
} from 'lucide-vue-next';
import { useAccountsStore } from '@/stores/accountsStore';
import { req } from '@/lib/request';
import { open as openWindow } from '@/lib/window';
import { useRouter } from 'vue-router';

const accountsStore = useAccountsStore();
const router = useRouter();

interface ZoneInfo {
	id: string;
	name: string;
	status: string;
	plan: { name: string };
	stats: {
		requests: number;
		bandwidth: number;
		uniques: number;
	};
}

interface DnsRecord {
	id: string;
	name: string;
	type: string;
	content: string;
	ttl: number;
	proxied: boolean;
	created_on: string;
}

const dialogState = reactive<{
	open: boolean;
	event: string;
	confirm: Function;
}>({
	open: false,
	event: '',
	confirm: () => {}
});

const loading = ref(false);
const error = ref('');
const zoneInfo = ref<ZoneInfo | null>(null);
const dnsRecords = ref<DnsRecord[]>([]);

const currentAccount = computed(() => accountsStore.currentAccount);
const currentAccountName = computed(() => accountsStore.currentAccountName);

const fetchZoneInfo = async () => {
	if (!currentAccount.value) return;
	loading.value = true;
	error.value = '';
	try {
		const res = await req({
			path: `/zones/${currentAccount.value.zoneId}`,
			authInfo: currentAccount.value,
		});
		const data = await res.json();
		if (data.success) {
			const zone = data.result;
			zoneInfo.value = {
				id: zone.id,
				name: zone.name,
				status: zone.status,
				plan: zone.plan,
				stats: {
					requests: 0,
					bandwidth: 0,
					uniques: 0,
				},
			};
		}
	} catch (err) {
		error.value = '获取区域信息失败';
		console.error(err);
	} finally {
		loading.value = false;
	}
};

const fetchDnsRecords = async () => {
	if (!currentAccount.value) return;
	loading.value = true;
	error.value = '';
	try {
		const res = await req({
			path: `/zones/${currentAccount.value.zoneId}/dns_records`,
			authInfo: currentAccount.value,
		});
		const data = await res.json();
		if (data.success) {
			dnsRecords.value = data.result;
		}
	} catch (err) {
		error.value = '获取DNS记录失败';
		console.error(err);
	} finally {
		loading.value = false;
	}
};

const getStatusColor = (status: string) => {
	switch (status) {
		case 'active': return 'text-green-500';
		case 'pending': return 'text-yellow-500';
		case 'disabled': return 'text-red-500';
		default: return 'text-gray-500';
	}
};

const updateDialogState = (event: string, confirm?: Function) => {
	dialogState.event = event;
	if(confirm) dialogState.confirm = confirm;
	dialogState.open = true;
};

onMounted(() => {
	if (!accountsStore.current) {
		router.push('/login?redirect=/dashboard');
		return;
	}
	fetchZoneInfo();
	fetchDnsRecords();

	watch(currentAccountName, (newVal) => {
		if (newVal) {
			fetchZoneInfo();
			fetchDnsRecords();
		}
	});
});
</script>

<template>
	<div class="container mx-auto p-6 space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">仪表盘</h1>
				<p class="text-muted-foreground">欢迎回来！{{ currentAccountName }}</p>
			</div>
			<div class="flex gap-4">
				<DropdownMenu>
					<DropdownMenuTrigger as-child>
						<Button variant="outline">
							切换用户
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent class="w-fit" align="start">
						<DropdownMenuLabel>用户</DropdownMenuLabel>
						<DropdownMenuGroup>
							<DropdownMenuItem v-for="(account, name) in accountsStore.accountList" :key="account.username || name"
								@click="accountsStore.setCurrent(name)" :disabled="name === currentAccountName">
								{{ account.username || name }} {{ (account.username || name) === currentAccountName ? '(当前用户)' : '' }}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuLabel>管理</DropdownMenuLabel>
						<DropdownMenuGroup>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger class="gap-2">
									<MoreHorizontalIcon class="h-4 w-4" />更多操作
								</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuItem @click="openWindow('/login?add', {width: 800, height: 600}, true)">
										<UserPlus2Icon /> 添加新用户
									</DropdownMenuItem>
									<DropdownMenuItem @click="router.push('/usercenter')">
										<Users2Icon /> 打开管理中心
									</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
							<DropdownMenuItem class="text-red-600 dark:text-red-400" @click="updateDialogState('退出当前用户', () => accountsStore.removeAccount(currentAccountName))">
								<LogOutIcon /> 退出当前用户
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
				<Button @click="fetchZoneInfo(); fetchDnsRecords();" :disabled="loading">
					<Loader2Icon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
					刷新数据
				</Button>
			</div>
		</div>

		<Alert v-if="error" variant="destructive">
			<AlertCircleIcon />
			<AlertTitle>出错了</AlertTitle>
			<AlertDescription>{{ error }}</AlertDescription>
		</Alert>

		<Dialog v-model:open="dialogState.open">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>二次确认</DialogTitle>
					<DialogDescription>确认要{{ dialogState.event }}吗？操作将无法撤销。</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="destructive" @click="dialogState.confirm">确认</Button>
					<Button @click="dialogState.open = false">取消</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium">DNS 记录</CardTitle>
					<ServerIcon class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{{ dnsRecords.length }}</div>
					<p class="text-xs text-muted-foreground">条 DNS 记录</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium">活跃域名</CardTitle>
					<GlobeIcon class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{{ zoneInfo?.name || '-' }}</div>
					<p class="text-xs text-muted-foreground">{{ zoneInfo?.plan?.name || '加载中...' }}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium">代理状态</CardTitle>
					<ShieldIcon class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">
						{{dnsRecords.filter(r => r.proxied).length}}
					</div>
					<p class="text-xs text-muted-foreground">条记录已代理</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between pb-2">
					<CardTitle class="text-sm font-medium">区域状态</CardTitle>
					<ActivityIcon class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold capitalize" :class="getStatusColor(zoneInfo?.status || '')">
						{{ zoneInfo?.status || '加载中' }}
					</div>
					<p class="text-xs text-muted-foreground">当前连接状态</p>
				</CardContent>
			</Card>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>区域信息</CardTitle>
					<CardDescription>当前令牌的区域详细信息</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div v-if="loading" class="flex items-center justify-center py-8">
						<Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
					<template v-else-if="zoneInfo">
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-1">
								<p class="text-sm text-muted-foreground">区域 ID</p>
								<p class="font-mono text-sm truncate">{{ zoneInfo.id }}</p>
							</div>
							<div class="space-y-1">
								<p class="text-sm text-muted-foreground">域名</p>
								<p class="font-medium">{{ zoneInfo.name }}</p>
							</div>
							<div class="space-y-1">
								<p class="text-sm text-muted-foreground">套餐</p>
								<p class="font-medium">{{ zoneInfo.plan.name }}</p>
							</div>
							<div class="space-y-1">
								<p class="text-sm text-muted-foreground">状态</p>
								<p class="font-medium capitalize" :class="getStatusColor(zoneInfo.status)">
									{{ zoneInfo.status }}
								</p>
							</div>
						</div>
					</template>
				</CardContent>
				<CardFooter>
					<Button variant="outline" class="w-full" @click="router.push('/dns')">
						管理 DNS 记录
						<ArrowUpRightIcon class="ml-2 h-4 w-4" />
					</Button>
				</CardFooter>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>快速操作</CardTitle>
					<CardDescription>常用的管理操作</CardDescription>
				</CardHeader>
				<CardContent class="grid gap-2">
					<Button variant="outline" class="justify-start" @click="router.push('/dns?add')">
						<ServerIcon class="mr-2 h-4 w-4" />
						添加 DNS 记录
					</Button>
					<Button variant="outline" class="justify-start" disabled>
						<ShieldIcon class="mr-2 h-4 w-4" />
						安全设置
					</Button>
					<Button variant="outline" class="justify-start" disabled>
						<ActivityIcon class="mr-2 h-4 w-4" />
						查看分析
					</Button>
				</CardContent>
			</Card>
		</div>
	</div>
</template>
