import { Link } from "react-router-dom";
import { BsFacebook } from "react-icons/bs";

const policyLinks = [
  { to: "/refund-return-policy", label: "退款及退貨政策" },
  { to: "/delivery-pickup-policy", label: "送貨及自取政策" },
  { to: "/privacy-policy", label: "私隱政策" },
  { to: "/terms", label: "條款及細則" },
];

export default function FooterCom() {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link to="/" className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
              SoapDelight.J
            </Link>
            <p className="max-w-sm text-sm leading-7 text-zinc-500">
              手作護理、香氣、陶瓷與生活選物，網站政策可於下列連結隨時查閱。
            </p>
          </div>

          <nav aria-label="網站政策" className="grid gap-3 sm:grid-cols-2 lg:min-w-[24rem]">
            {policyLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-4 lg:items-end">
            <p className="text-sm text-zinc-500 lg:text-right">
              © {new Date().getFullYear()} SoapDelight.J. 版權所有。
            </p>

            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=61555597584696"
                className="transition hover:text-zinc-950 dark:hover:text-white"
                aria-label="SoapDelight.J Facebook"
                target="_blank"
                rel="noreferrer"
              >
                <BsFacebook size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
