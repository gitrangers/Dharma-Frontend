import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Karla, Hammersmith_One, Montserrat } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.scss";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
const karla = Karla({
    subsets: ["latin"],
    variable: "--font-karla",
    display: "swap",
    weight: ["300", "400", "500", "600", "700"],
});
const hammersmith = Hammersmith_One({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-hammersmith",
    display: "swap",
});
const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat",
    display: "swap",
    weight: ["500", "600", "700"],
});
export const metadata = {
    title: "Dharma Productions",
    description: "Dharma Productions — Official site (Next.js frontend)",
};
export const viewport = {
    width: "device-width",
    initialScale: 1,
};
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "en", className: `${karla.variable} ${hammersmith.variable} ${montserrat.variable}`, children: _jsxs("body", { className: `${karla.className} bg-white d-flex flex-column min-vh-100`, children: [_jsx(SiteHeader, {}), _jsx("main", { className: "site-main flex-grow-1", children: children }), _jsx(SiteFooter, {})] }) }));
}
