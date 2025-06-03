"use client";
import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import "./Navbar.css";

const NavItem: FC<{
	name: string;
	pulledOut: Boolean;
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
			["Github", "/About"],
			["Linkedin", "/History"],
		],
		"Login / Logout": [
			["Login", "/login"],
			["Logout", "/logout"]
		],
		"Chat": [["Chat", "/chat"]],

		"Inquiries": [["Email", "/Contact"]],
	};
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

	const controlNavbar = () => {
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
	};

	useEffect(() => {
		window.addEventListener("scroll", controlNavbar);

		// cleanup function
		return () => {
			window.removeEventListener("scroll", controlNavbar);
		};
	}, [lastScrollY]);

	return (
		<nav className={firstDrop ? "" : show ? "active" : "hidden"}>
			<Link href="/" className="fullLogo">
				<Image src="/chat-logo.png" alt="Home" width={17} height={17} />
				Home
			</Link>

			<ul>
				{Object.entries(navigation).map(([key, options], i) =>
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
				)}
			</ul>
		</nav>
	);
}
