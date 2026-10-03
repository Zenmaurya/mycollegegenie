'use client';
import React from 'react';
import { cn } from '../lib/utils';
import { useRef, useEffect } from 'react';

type WWavePathProps = React.ComponentProps<'div'>;

export function WavePath({ className, ...props }: WWavePathProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const path = useRef<SVGPathElement>(null);
	let progress = 0;
	let x = 0.2;
	let time = Math.PI / 2;
	let reqId: number | null = null;

	useEffect(() => {
		setPath(progress);
		const handleResize = () => setPath(progress);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const setPath = (progress: number) => {
		const width = containerRef.current?.offsetWidth || window.innerWidth;
		if (path.current) {
			path.current.setAttributeNS(
				null,
				'd',
				`M0 100 Q${width * x} ${100 + progress * 0.6}, ${width} 100`,
			);
		}
	};

	const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

	const manageMouseEnter = () => {
		if (reqId) {
			cancelAnimationFrame(reqId);
			resetAnimation();
		}
	};

	const manageMouseMove = (e: React.MouseEvent) => {
		const { movementY, clientX } = e;
		if (path.current) {
			const pathBound = path.current.getBoundingClientRect();
			if (pathBound.width > 0) {
				x = (clientX - pathBound.left) / pathBound.width;
				// Increased sensitivity to mouse movement
				progress += movementY * 1.5;
				setPath(progress);
			}
		}
	};

	const manageMouseLeave = () => {
		animateOut();
	};

	const animateOut = () => {
		const newProgress = progress * Math.sin(time);
		// Faster settling (increased from 0.025)
		progress = lerp(progress, 0, 0.08);
		// Faster oscillation
		time += 0.4;
		setPath(newProgress);
		if (Math.abs(progress) > 0.5) {
			reqId = requestAnimationFrame(animateOut);
		} else {
			resetAnimation();
		}
	};

	const resetAnimation = () => {
		time = Math.PI / 2;
		progress = 0;
	};

	return (
		<div ref={containerRef} className={cn('relative h-1 w-full', className)} {...props}>
			<div
				onMouseEnter={manageMouseEnter}
				onMouseMove={manageMouseMove}
				onMouseLeave={manageMouseLeave}
				className="relative -top-5 z-10 h-10 w-full hover:-top-[150px] hover:h-[300px]"
			/>
			<svg className="absolute -top-[100px] h-[300px] w-full pointer-events-none">
				<path ref={path} className="fill-none stroke-current" stroke="currentColor" strokeWidth={2} />
			</svg>
		</div>
	);
}
