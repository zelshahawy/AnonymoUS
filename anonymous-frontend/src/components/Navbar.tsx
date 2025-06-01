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
		"About Ziad": [
			["Github", "/About"],
			["Linkedin", "/History"],
		],
		Login: [
			["login", "/login"],
			["logout", "/logout"]
		],
		Inquiries: [["Inquiries", "/Contact"]],
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
		<nav className={firstDrop ? "" : show == false ? "hidden" : "active"}>
			<Link href="/" className={"fullLogo"}>
				{" "}
				<Image
					src="/chat-logo.png"
					alt="Next.js Logo"
					className={"logoImage"}
					width={17}
					height={17}
					priority
				/>{" "}
				Chat
			</Link>

			<ul>
				{Object.entries(navigation).map(([key, value], i) => (
					<NavItem
						name={key}
						key={i}
						pulledOut={pulledOut[i]}
						options={value}
						handler={handlePullout}
						closer={handleCloser}
						pos={i}
					/>
				))}
			</ul>
		</nav>
	);
}
