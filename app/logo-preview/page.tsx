'use client';
import { 
  LogoScopeTarget, 
  LogoDocument, 
  LogoBlocks, 
  LogoMonogram, 
  LogoLightning,
  LogoHammerDoc,
  LogoIcon
} from '@/components/Logo';
import { Hammer } from 'lucide-react';

export default function LogoPreview() {
  return (
    <div className="min-h-screen bg-slate-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 text-center">ScopeGen Logo Options</h1>
        <p className="text-slate-600 text-center mb-12">Choose your preferred logo design</p>
        
        {/* Current Logo */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Current Logo</h2>
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-[#f5a623] p-1.5 rounded-sm">
                <Hammer className="w-5 h-5 text-[#3d5a80]" />
              </div>
              <span className="text-xl font-bold text-[#3d5a80] uppercase tracking-tight">
                ScopeGen
              </span>
            </div>
          </div>
        </div>

        {/* New Logo Options */}
        <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">New Logo Options</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Option 1: Scope Target */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-sm font-medium text-orange-600 mb-3">Option 1: Scope Target</div>
            <p className="text-xs text-slate-500 mb-4">Precision crosshair representing "Scope" of work</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">XL:</span>
                <LogoScopeTarget size="xl" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">LG:</span>
                <LogoScopeTarget size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">MD:</span>
                <LogoScopeTarget size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">SM:</span>
                <LogoScopeTarget size="sm" />
              </div>
              <div className="flex items-center gap-4 pt-2 border-t">
                <span className="text-xs text-slate-400 w-8">Icon:</span>
                <LogoScopeTarget size="md" showText={false} />
              </div>
            </div>
          </div>

          {/* Option 2: Document */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-sm font-medium text-orange-600 mb-3">Option 2: Document</div>
            <p className="text-xs text-slate-500 mb-4">Professional proposal document with checklist</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">XL:</span>
                <LogoDocument size="xl" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">LG:</span>
                <LogoDocument size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">MD:</span>
                <LogoDocument size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">SM:</span>
                <LogoDocument size="sm" />
              </div>
              <div className="flex items-center gap-4 pt-2 border-t">
                <span className="text-xs text-slate-400 w-8">Icon:</span>
                <LogoDocument size="md" showText={false} />
              </div>
            </div>
          </div>

          {/* Option 3: Blocks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-sm font-medium text-orange-600 mb-3">Option 3: Building Blocks</div>
            <p className="text-xs text-slate-500 mb-4">Construction blocks representing building</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">XL:</span>
                <LogoBlocks size="xl" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">LG:</span>
                <LogoBlocks size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">MD:</span>
                <LogoBlocks size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">SM:</span>
                <LogoBlocks size="sm" />
              </div>
              <div className="flex items-center gap-4 pt-2 border-t">
                <span className="text-xs text-slate-400 w-8">Icon:</span>
                <LogoBlocks size="md" showText={false} />
              </div>
            </div>
          </div>

          {/* Option 4: Monogram */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-sm font-medium text-orange-600 mb-3">Option 4: SG Monogram</div>
            <p className="text-xs text-slate-500 mb-4">Clean stylized initials</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">XL:</span>
                <LogoMonogram size="xl" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">LG:</span>
                <LogoMonogram size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">MD:</span>
                <LogoMonogram size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">SM:</span>
                <LogoMonogram size="sm" />
              </div>
              <div className="flex items-center gap-4 pt-2 border-t">
                <span className="text-xs text-slate-400 w-8">Icon:</span>
                <LogoMonogram size="md" showText={false} />
              </div>
            </div>
          </div>

          {/* Option 5: Lightning */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-sm font-medium text-orange-600 mb-3">Option 5: Lightning Speed</div>
            <p className="text-xs text-slate-500 mb-4">Fast proposal generation emphasis</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">XL:</span>
                <LogoLightning size="xl" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">LG:</span>
                <LogoLightning size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">MD:</span>
                <LogoLightning size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">SM:</span>
                <LogoLightning size="sm" />
              </div>
              <div className="flex items-center gap-4 pt-2 border-t">
                <span className="text-xs text-slate-400 w-8">Icon:</span>
                <LogoLightning size="md" showText={false} />
              </div>
            </div>
          </div>

          {/* Option 6: Hammer + Doc */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-sm font-medium text-orange-600 mb-3">Option 6: Hammer & Doc</div>
            <p className="text-xs text-slate-500 mb-4">Evolution of current design</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">XL:</span>
                <LogoHammerDoc size="xl" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">LG:</span>
                <LogoHammerDoc size="lg" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">MD:</span>
                <LogoHammerDoc size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-8">SM:</span>
                <LogoHammerDoc size="sm" />
              </div>
              <div className="flex items-center gap-4 pt-2 border-t">
                <span className="text-xs text-slate-400 w-8">Icon:</span>
                <LogoHammerDoc size="md" showText={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Dark Background Preview */}
        <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">On Dark Background</h2>
        <div className="bg-slate-900 rounded-xl p-8 mb-12">
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <LogoScopeTarget size="lg" showText={false} />
              <p className="text-slate-400 text-xs mt-2">Scope Target</p>
            </div>
            <div className="text-center">
              <LogoDocument size="lg" showText={false} />
              <p className="text-slate-400 text-xs mt-2">Document</p>
            </div>
            <div className="text-center">
              <LogoBlocks size="lg" showText={false} />
              <p className="text-slate-400 text-xs mt-2">Blocks</p>
            </div>
            <div className="text-center">
              <LogoMonogram size="lg" showText={false} />
              <p className="text-slate-400 text-xs mt-2">Monogram</p>
            </div>
            <div className="text-center">
              <LogoLightning size="lg" showText={false} />
              <p className="text-slate-400 text-xs mt-2">Lightning</p>
            </div>
            <div className="text-center">
              <LogoHammerDoc size="lg" showText={false} />
              <p className="text-slate-400 text-xs mt-2">Hammer & Doc</p>
            </div>
          </div>
        </div>

        {/* Favicon Preview */}
        <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Favicon Sizes</h2>
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="w-[16px] h-[16px] overflow-hidden">
                <LogoIcon variant="scope" />
              </div>
              <p className="text-xs text-slate-400 mt-2">16x16</p>
            </div>
            <div className="text-center">
              <div className="w-[32px] h-[32px]">
                <LogoIcon variant="scope" />
              </div>
              <p className="text-xs text-slate-400 mt-2">32x32</p>
            </div>
            <div className="text-center">
              <div className="w-[48px] h-[48px]">
                <LogoIcon variant="scope" />
              </div>
              <p className="text-xs text-slate-400 mt-2">48x48</p>
            </div>
            <div className="text-center">
              <div className="w-[64px] h-[64px]">
                <LogoScopeTarget size="xl" showText={false} />
              </div>
              <p className="text-xs text-slate-400 mt-2">64x64</p>
            </div>
            <div className="text-center">
              <div className="w-[128px] h-[128px]">
                <LogoScopeTarget size="xl" showText={false} className="scale-[2.5] origin-top-left" />
              </div>
              <p className="text-xs text-slate-400 mt-2">128x128</p>
            </div>
          </div>
        </div>

        {/* Header Preview */}
        <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2 mt-12">In Header Context</h2>
        <div className="space-y-4">
          {[
            { name: 'Scope Target', Component: LogoScopeTarget },
            { name: 'Document', Component: LogoDocument },
            { name: 'Blocks', Component: LogoBlocks },
            { name: 'Lightning', Component: LogoLightning },
          ].map(({ name, Component }) => (
            <div key={name} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b px-4 h-16 flex items-center justify-between">
                <Component size="md" />
                <nav className="flex items-center gap-6">
                  <span className="text-sm text-slate-500">Dashboard</span>
                  <span className="text-sm text-slate-500">Pricing</span>
                  <span className="text-sm text-slate-500">Settings</span>
                  <button className="bg-[#3d5a80] text-white px-4 py-2 rounded-md text-sm font-semibold">
                    Create Proposal
                  </button>
                </nav>
              </div>
              <div className="px-4 py-2 bg-slate-50">
                <span className="text-xs text-slate-400">{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
