<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from '@/components/ui/alert';
import {
	AlertCircleIcon,
	Loader2Icon,
	ServerIcon,
	ShieldIcon,
	GlobeIcon,
	ActivityIcon,
	ArrowUpRightIcon,
	ArrowDownRightIcon,
} from 'lucide-vue-next';
import { useAccountsStore } from '@/stores/accountsStore';
import { req } from '@/lib/request';
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

const loading = ref(false);
const error = ref('');
const zoneInfo = ref<ZoneInfo | null>(null);
const dnsRecords = ref<DnsRecord[]>([]);
const searchQuery = ref('');

const currentAccount = computed(() => accountsStore.currentAccount);

const filteredRecords = computed(() => {
	if (!searchQuery.value) return dnsRecords.value;
	const q = searchQuery.value.toLowerCase();
	return dnsRecords.value.filter(r =>
		r.name.toLowerCase().includes(q) ||
		r.type.toLowerCase().includes(q) ||
		r.content.toLowerCase().includes(q)
	);
});

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

const getTypeColor = (type: string) => {
	const colors: Record<string, string> = {
		A: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
		AAAA: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
		CNAME: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
		MX: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
		TXT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
	};
	return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

onMounted(() => {
	if (!accountsStore.current) {
		router.push('/login?redirect=/dashboard');
		return;
	}
	fetchZoneInfo();
	fetchDnsRecords();
});
</script>

<template>
	<div class="container mx-auto p-6 space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">仪表盘</h1>
				<p class="text-muted-foreground">欢迎回来！</p>
			</div>
			<Button @click="fetchZoneInfo(); fetchDnsRecords();" :disabled="loading">
				<Loader2Icon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
				刷新数据
			</Button>
		</div>

		<Alert v-if="error" variant="destructive">
			<AlertCircleIcon />
			<AlertTitle>出错了</AlertTitle>
			<AlertDescription>{{ error }}</AlertDescription>
		</Alert>

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
						{{ dnsRecords.filter(r => r.proxied).length }}
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

		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle>DNS 记录</CardTitle>
						<CardDescription>最近添加的 DNS 记录</CardDescription>
					</div>
					<Input
						v-model="searchQuery"
						placeholder="搜索记录..."
						class="max-w-xs"
					/>
				</div>
			</CardHeader>
			<CardContent>
				<div v-if="loading" class="flex items-center justify-center py-8">
					<Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
				<div v-else-if="filteredRecords.length === 0" class="text-center py-8 text-muted-foreground">
					<p>暂无 DNS 记录</p>
				</div>
				<div v-else class="space-y-2">
					<div
						v-for="record in filteredRecords"
						:key="record.id"
						class="flex items-center justify-between p-3 rounded-lg border"
					>
						<div class="flex items-center gap-4">
							<span class="px-2 py-1 rounded text-xs font-medium" :class="getTypeColor(record.type)">
								{{ record.type }}
							</span>
							<div>
								<p class="font-medium">{{ record.name }}</p>
								<p class="text-sm text-muted-foreground truncate max-w-md">{{ record.content }}</p>
							</div>
						</div>
						<div class="flex items-center gap-4">
							<span
								class="px-2 py-1 rounded text-xs"
								:class="record.proxied ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'"
							>
								{{ record.proxied ? '代理' : 'DNS' }}
							</span>
							<ArrowDownRightIcon class="h-4 w-4 text-muted-foreground" />
						</div>
					</div>
				</div>
			</CardContent>
			<CardFooter v-if="filteredRecords.length > 0">
				<p class="text-sm text-muted-foreground">
					显示 {{ filteredRecords.length }} 条记录，共 {{ dnsRecords.length }} 条
				</p>
			</CardFooter>
		</Card>
	</div>
</template>
