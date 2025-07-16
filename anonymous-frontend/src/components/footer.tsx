import "./footer.css";

export default function Footer() {
	return (
		<>
			<footer className="footer">
				<div className="footer-content">
					<p>© {new Date().getFullYear()} Ziad Elshahawy. All rights reserved.</p>
				</div>
			</footer>
		</>
	);
}
