"use client";
import Image from "next/image";
import Link from "next/link";
import { FC, useCallback, useEffect, useState } from "react";
import "./Navbar.css";
import UserProfile from "./UserProfile";

const NavItem: FC<{
	name: string;
	pulledOut: boolean;
	options: [string, string][];
	handler: (i: number) => void;
	closer: () => void;
	pos: number;
}> = ({ name, pulledOut, options, handler, closer, pos }) => {
	return (
		<h4
			className={"navOption"}
			onMouseLeave={pulledOut ? closer : undefined}
			onMouseOver={
				pulledOut
					? undefined
					: () => {
						handler(pos);
					}
			}
		>
			<div className={"circle" + (pulledOut ? " on" : "")}> </div>
			{name}
			{pulledOut ? (
				<div className={"dropDown"}>
					{" "}
					{options.map((option: [string, string]) => (
						<li key={option[0]}>
							<Link href={option[1]}>{option[0]}</Link>
						</li>
					))}
				</div>
			) : null}
		</h4>
	);
};

export default function Navbar() {
	const navigation: { [key: string]: [string, string][] } = {
		"About Me": [
			["Github", "https://github.com/zelshahawy"],
			["LinkedIn", "https://www.linkedin.com/in/ziad-elshahawy"],
		],
		"Login / Logout": [
			["Login", "/login"],
			["Logout", "/logout"],
		],
		"Chat": [["Chat", "/chat"]],
		"Inquiries": [["Email", "mailto:ziad.a.elshahawy@gmail.com"]],
	}
	const [isMobileView, setIsMobileView] = useState(false);
	const [show, setShow] = useState(true);
	const [pulledOut, setPulledOut] = useState(
		new Array(Object.entries(navigation).length).fill(false)
	);
	const [firstDrop, setDrop] = useState(true);
	const handlePullout = (i: number) => {
		setPulledOut(
			pulledOut.map((bool, ind) => {
				return i === ind;
			})
		);
	};
	const handleCloser = () => {
		setPulledOut(new Array(pulledOut.length).fill(false));
	};
	const [lastScrollY, setLastScrollY] = useState(0);

	const controlNavbar = useCallback(() => {
		if (isMobileView) {
			if (!show) setShow(true);
			if (!firstDrop) setDrop(true);
			return;
		}

		if (window.scrollY > lastScrollY) {
			// if scroll down hide the navbar
			if (firstDrop) {
				setDrop(false);
			}
			setShow(false);
		} else {
			// if scroll up show the navbar
			setShow(true);
		}

		// remember current page location to use in the next move
		setLastScrollY(window.scrollY);
	}, [firstDrop, isMobileView, lastScrollY, show]);

	useEffect(() => {
		if (isMobileView) return;
		window.addEventListener("scroll", controlNavbar);

		// cleanup function
		return () => {
			window.removeEventListener("scroll", controlNavbar);
		};
	}, [controlNavbar, isMobileView]);

	useEffect(() => {
		const syncViewport = () => {
			const isMobile = window.innerWidth <= 768;
			setIsMobileView(isMobile);

			if (!isMobile) {
				return;
			}

			setShow(true);
			setDrop(true);
		};

		syncViewport();
		window.addEventListener("resize", syncViewport);
		return () => window.removeEventListener("resize", syncViewport);
	}, [])

	const navVisibilityClass = isMobileView ? "" : firstDrop ? "" : show ? "nav-active" : "nav-hidden";

	if (isMobileView) {
		return (
			<nav className="mobile-nav">
				<Link href="/" className="mobile-home" aria-label="Home">
					<Image src="/chat-logo.png" alt="Home" width={18} height={18} />
				</Link>

				<div className="mobile-actions">
					<Link href="/chat" className="mobile-chat-link">
						Chat
					</Link>
					<div className="mobile-profile">
						<UserProfile />
					</div>
				</div>
			</nav>
		);
	}

	return (
		<nav className={navVisibilityClass}>
			<Link href="/" className="fullLogo">
				<Image src="/chat-logo.png" alt="Home" width={17} height={17} />
				Home
			</Link>

			<ul>
				{
					Object.entries(navigation).map(([key, options], i) =>
						options.length === 1 ? (
							// single-item menus become a simple link
							<li key={key}>
								<Link href={options[0][1]} className="navOption">
									{options[0][0]}
								</Link>
							</li>
						) : (
							// multi-item menus keep the dropdown behavior
							<NavItem
								name={key}
								key={key}
								pulledOut={pulledOut[i]}
								options={options}
								handler={handlePullout}
								closer={handleCloser}
								pos={i}
							/>
						)
					)
				}
			</ul>

			<div className="ml-auto">
				<UserProfile />
			</div>
		</nav >
	);
}
