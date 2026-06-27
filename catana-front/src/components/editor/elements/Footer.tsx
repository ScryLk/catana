import { type FC } from 'react';
import { type FooterData } from '../../../types/editor';

interface FooterProps {
  data: FooterData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const Footer: FC<FooterProps> = ({
  data,
  isSelected = false,
  onSelect,
}) => {
  return (
    <footer
      className={`
        bg-gray-900 text-white rounded-lg border-2 transition-all
        ${isSelected ? 'border-primary-500 shadow-xl ring-4 ring-primary-200' : 'border-gray-800 shadow-lg'}
      `}
      onClick={onSelect}
    >
      <div className="px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo Section */}
          {data.logo && (
            <div className="lg:col-span-1">
              <img
                src={data.logo}
                alt="Logo"
                className="h-10 w-auto mb-4"
              />
            </div>
          )}

          {/* Footer Sections */}
          {data.sections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Links */}
        {data.socialLinks && data.socialLinks.length > 0 && (
          <div className="border-t border-gray-800 pt-8 mb-8">
            <div className="flex justify-center gap-6">
              {data.socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-xl transition-colors"
                  title={social.platform}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400 text-sm">{data.copyright}</p>
        </div>
      </div>
    </footer>
  );
};
