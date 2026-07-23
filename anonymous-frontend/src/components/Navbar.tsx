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
		<li
			className={"navOption navTrigger" + (pulledOut ? " open" : "")}
			onMouseLeave={pulledOut ? closer : undefined}
			onMouseOver={
				pulledOut
					? undefined
					: () => {
						handler(pos);
					}
			}
		>
			<div className={"circle" + (pulledOut ? " on" : "")} />
			<span>{name}</span>
			{pulledOut ? (
				<ul className="dropDown">
					{options.map((option: [string, string]) => (
						<li key={option[0]}>
							<Link href={option[1]}>{option[0]}</Link>
						</li>
					))}
				</ul>
			) : null}
		</li>
	);
};

export default function Navbar() {
	const [user, setUser] = useState<string | undefined>(undefined);
	const [authChecked, setAuthChecked] = useState(false);

	useEffect(() => {
		let cancelled = false;
		fetch('/api/me', { credentials: 'include' })
			.then(res => (res.ok ? res.json() : null))
			.then(data => {
				if (!cancelled) {
					setUser(data?.username || undefined);
					setAuthChecked(true);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setUser(undefined);
					setAuthChecked(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Appended last so its presence never shifts the other items.
	const navigation: { [key: string]: [string, string][] } = {
		"Home": [["Home", "/"]],
		"Login / Logout": [
			["Login", "/login"],
			["Logout", "/logout"],
		],
		"About Me": [["About Me", "https://ziadelshahawy.dev"]],
		...(user ? { "Chat": [["Chat", "/chat"]] } : {}),
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
			if (firstDrop) {
				setDrop(false);
			}
			setShow(false);
		} else {
			setShow(true);
		}

		setLastScrollY(window.scrollY);
	}, [firstDrop, isMobileView, lastScrollY, show]);

	useEffect(() => {
		if (isMobileView) return;
		window.addEventListener("scroll", controlNavbar);

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
					<a
						href="https://ziadelshahawy.dev"
						className="mobile-nav-link"
						target="_blank"
						rel="noopener noreferrer"
					>
						About Me
					</a>
					{user && (
						<Link href="/chat" className="mobile-nav-link">
							Chat
						</Link>
					)}
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
				<Image src="/chat-logo.png" alt="AnonymoUS" width={17} height={17} />
				AnonymoUS
			</Link>

			<ul>
				{
					// Gated on authChecked so links (Chat included) render together instead of popping in.
					authChecked && Object.entries(navigation).map(([key, options], i) =>
						options.length === 1 ? (
							<li key={key}>
								<Link
									href={options[0][1]}
									className="navOption"
									{...(options[0][1].startsWith("http")
										? { target: "_blank", rel: "noopener noreferrer" }
										: {})}
								>
									{options[0][0]}
								</Link>
							</li>
						) : (
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
