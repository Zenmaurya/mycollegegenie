'use client';
import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, User, Newspaper, Calendar, LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';

export function Header({ user, appUser, logout }: any) {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);
	const location = useLocation();

	const links = [
		{ label: 'Home', href: '/' },
		{ label: 'Browse', href: '/browse' },
		{ label: 'Playlists', href: '/playlists' },
		{ label: 'Find PG', href: '/find-pg' },
		{ label: 'Forums', href: '/forum' },
	];

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn(
				'sticky top-0 z-[100] mx-auto w-full max-w-7xl border-b border-transparent md:rounded-md md:border md:transition-all md:ease-out',
				{
					'bg-white/95 supports-[backdrop-filter]:bg-white/50 border-gray-200 backdrop-blur-lg md:top-4 md:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)]':
						scrolled && !open,
					'bg-white/90': open,
					'bg-white/60 backdrop-blur-xl py-2': !scrolled && !open,
				},
			)}
		>
			<nav
				className={cn(
					'flex h-16 w-full items-center justify-between px-4 md:h-14 md:transition-all md:ease-out',
					{
						'md:px-4': scrolled,
					},
				)}
			>
				<Link to="/" className="flex items-center gap-2 cursor-pointer shrink-0 group">
					<div className="relative">
						<div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-purple-500/30 lg:group-hover:rotate-6 transition-transform duration-300 flex items-center justify-center">
							<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
						</div>
						<div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full shadow-sm"></div>
					</div>
					<div className="flex flex-col leading-[1.1] sm:leading-none">
						<span className="text-[13px] sm:text-lg font-black text-gray-900 tracking-tighter uppercase lg:group-hover:text-indigo-600 transition-colors">My College</span>
						<span className="text-[13px] sm:text-lg font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tighter uppercase transition-all">Genie</span>
					</div>
				</Link>

				<div className="hidden items-center gap-2 xl:flex">
					{links.map((link, i) => (
						<Link 
							key={i} 
							className={cn(buttonVariants({ variant: 'ghost' }), location.pathname === link.href ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-500 hover:text-purple-600')} 
							to={link.href}
						>
							{link.label}
						</Link>
					))}
					
					{/* Campus Updates Dropdown */}
					<div className="relative group">
						<button className={cn(buttonVariants({ variant: 'ghost' }), (location.pathname === '/news' || location.pathname === '/events') ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-500 hover:text-purple-600')}>
							Campus Updates
						</button>
						<div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 z-50">
							<div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-2 flex flex-col gap-1">
								<Link to="/news" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors", location.pathname === '/news' ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50')}>
									<Newspaper className="w-4 h-4" /> News
								</Link>
								<Link to="/events" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors", location.pathname === '/events' ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50')}>
									<Calendar className="w-4 h-4" /> Events
								</Link>
							</div>
						</div>
					</div>

					{appUser?.role === 'admin' && (
						<Link to="/admin" className={cn(buttonVariants({ variant: 'ghost' }), location.pathname === '/admin' ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-500 hover:text-purple-600')}>
							Admin
						</Link>
					)}

					{user ? (
						<div className="flex items-center gap-3 pl-4 border-l border-gray-200 ml-2">
							<div className="flex flex-col items-end">
								<span className="text-xs font-black text-gray-900 tracking-tight">{user.displayName}</span>
								<button onClick={() => logout()} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">Sign Out</button>
							</div>
							<motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-purple-100 shadow-lg">
								{user.photoURL ? (
									<img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
								) : (
									<div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-600">
										<User className="w-5 h-5" />
									</div>
								)}
							</motion.div>
						</div>
					) : (
						<Link to="/login" className={cn(buttonVariants({ variant: 'default' }), "bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xl shadow-purple-600/30 ml-2")}>
							Sign In
						</Link>
					)}
				</div>
				<Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="xl:hidden">
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>

			<div
				className={cn(
					'bg-white/95 fixed top-16 right-0 bottom-0 left-0 z-50 flex flex-col overflow-y-auto border-t border-gray-100 xl:hidden',
					open ? 'block' : 'hidden',
				)}
			>
				<div
					data-slot={open ? 'open' : 'closed'}
					className={cn(
						'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
						'flex h-full w-full flex-col gap-y-4 p-4',
					)}
				>
					<div className="grid gap-y-2">
						{links.map((link) => (
							<Link
								key={link.label}
								className={cn(buttonVariants({ variant: 'ghost', className: 'justify-start text-lg py-6' }), location.pathname === link.href ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-600')}
								to={link.href}
								onClick={() => setOpen(false)}
							>
								{link.label}
							</Link>
						))}
						<Link to="/news" className={cn(buttonVariants({ variant: 'ghost', className: 'justify-start text-lg py-6' }), location.pathname === '/news' ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-600')} onClick={() => setOpen(false)}>
							Campus News
						</Link>
						<Link to="/events" className={cn(buttonVariants({ variant: 'ghost', className: 'justify-start text-lg py-6' }), location.pathname === '/events' ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-600')} onClick={() => setOpen(false)}>
							Campus Events
						</Link>
						{appUser?.role === 'admin' && (
							<Link to="/admin" className={cn(buttonVariants({ variant: 'ghost', className: 'justify-start text-lg py-6' }), location.pathname === '/admin' ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-600')} onClick={() => setOpen(false)}>
								Admin Panel
							</Link>
						)}
					</div>
					<div className="flex flex-col gap-4 mt-auto pt-4 border-t border-gray-100">
						{user ? (
							<div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-purple-100">
										{user.photoURL ? (
											<img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
										) : (
											<div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-600">
												<User className="w-5 h-5" />
											</div>
										)}
									</div>
									<span className="font-bold text-gray-900">{user.displayName}</span>
								</div>
								<Button variant="destructive" onClick={() => { logout(); setOpen(false); }}>Sign Out</Button>
							</div>
						) : (
							<Link to="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: 'default' }), "w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg rounded-xl")}>
								Sign In
							</Link>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
