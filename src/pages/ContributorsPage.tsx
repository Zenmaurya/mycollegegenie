import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Star, Lightbulb, X, Award, Linkedin, Instagram, Github, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Contributor, getContributors } from '../services/contributorService';

export function ContributorsPage() {
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    async function loadData() {
      try {
        const data = await getContributors();
        setContributors(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const coreTeam = contributors.filter(c => c.category === 'core_team');
  const featureContributors = contributors.filter(c => c.category === 'feature_contributor');
  const resourceContributors = contributors.filter(c => c.category === 'resource_contributor');
  const wallOfFame = contributors.filter(c => c.category === 'wall_of_fame');

  return (
    <div className="min-h-screen bg-[#0B0914] text-white pt-24 pb-20 md:pb-6 relative overflow-hidden flex flex-col">
      <Helmet>
        <title>Our Team & Contributors | My College Genie</title>
        <meta name="description" content="Meet the team and top contributors behind My College Genie." />
      </Helmet>

      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 w-full">
        
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-purple-300 font-medium text-sm mb-6"
          >
            <Users className="w-4 h-4" />
            <span>The People Behind The Magic</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
          >
            Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Team & Contributors</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            My College Genie wouldn't be possible without the dedication of our core team and the active support of our student community.
          </motion.p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Section: Core Team */}
            {coreTeam.length > 0 && (
              <div className="mb-24">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <Award className="w-6 h-6 text-purple-400" />
                  Core Team
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coreTeam.map((member, i) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      onClick={() => setSelectedContributor(member)}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all group cursor-pointer hover:border-purple-500/30"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 p-1 shrink-0">
                          <img src={member.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} className="w-full h-full rounded-full object-cover bg-purple-900/50" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-100 group-hover:text-purple-400 transition-colors">{member.name}</h3>
                          <p className="text-purple-400 text-sm font-medium">{member.role}</p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">{member.bio}</p>
                      <div className="flex flex-wrap gap-2">
                        {member.badges?.slice(0, 3).map(badge => (
                          <span key={badge} className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Feature Contributors */}
            {featureContributors.length > 0 && (
              <div className="mb-24">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Star className="w-6 h-6 text-blue-400" />
                    Feature Contributors
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {featureContributors.map((contributor, i) => (
                    <motion.div
                      key={contributor.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => setSelectedContributor(contributor)}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 cursor-pointer hover:bg-white/[0.08] hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all group text-center flex flex-col items-center justify-between"
                    >
                      <div>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden bg-white/10 p-1 mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                          <img src={contributor.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.name}`} alt={contributor.name} className="w-full h-full rounded-full object-cover bg-blue-900/50" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-1">{contributor.name}</h3>
                        <p className="text-gray-400 text-xs font-medium mb-3 line-clamp-1">{contributor.role}</p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold mt-auto">
                        <Star className="w-3 h-3 fill-blue-500 text-blue-500" />
                        {contributor.contributions} <span className="hidden sm:inline">Points</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Resource Contributors */}
            {resourceContributors.length > 0 && (
              <div className="mb-24">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-emerald-400" />
                    Resource Contributors
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {resourceContributors.map((contributor, i) => (
                    <motion.div
                      key={contributor.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => setSelectedContributor(contributor)}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 cursor-pointer hover:bg-white/[0.08] hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all group text-center flex flex-col items-center justify-between"
                    >
                      <div>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden bg-white/10 p-1 mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                          <img src={contributor.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.name}`} alt={contributor.name} className="w-full h-full rounded-full object-cover bg-emerald-900/50" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-100 group-hover:text-emerald-400 transition-colors line-clamp-1">{contributor.name}</h3>
                        <p className="text-gray-400 text-xs font-medium mb-3 line-clamp-1">{contributor.role}</p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-gray-300 text-xs font-semibold mt-auto">
                        <Lightbulb className="w-3 h-3 text-emerald-500" />
                        {contributor.contributions} <span className="hidden sm:inline">Points</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Wall of Fame (Improvement Suggesters) */}
            {wallOfFame.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-pink-400" />
                  Wall of Fame
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                  <p className="text-gray-400 text-sm mb-6">
                    A huge thanks to the students who reported bugs, suggested improvements, and helped shape the platform into what it is today.
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {wallOfFame.map((user, i) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.02 * i }}
                        onClick={() => user.bio || user.social_linkedin ? setSelectedContributor(user) : null}
                        className={`px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[13px] sm:text-sm font-medium transition-colors ${
                          user.bio || user.social_linkedin ? 'cursor-pointer hover:bg-white/10 hover:text-white hover:border-pink-500/30' : ''
                        }`}
                      >
                        {user.name}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Contributor Profile Modal */}
      <AnimatePresence>
        {selectedContributor && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedContributor(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#13111C] border border-white/10 shadow-2xl rounded-3xl overflow-hidden z-10"
            >
              {/* Modal Banner */}
              <div className="h-24 bg-gradient-to-r from-purple-600 to-pink-600 relative">
                <button 
                  onClick={() => setSelectedContributor(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Profile Info */}
              <div className="px-6 pb-8 text-center relative -mt-12">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-[#13111C] bg-[#13111C] mb-4">
                  <img src={selectedContributor.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedContributor.name}`} alt={selectedContributor.name} className="w-full h-full object-cover bg-gray-800" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-1">{selectedContributor.name}</h3>
                <p className="text-purple-400 font-medium text-sm mb-4">{selectedContributor.role || 'Contributor'}</p>
                
                {selectedContributor.bio && (
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed px-4">
                    "{selectedContributor.bio}"
                  </p>
                )}
                
                {selectedContributor.badges && selectedContributor.badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {selectedContributor.badges.map(badge => (
                      <span key={badge} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold">
                        {badge}
                      </span>
                    ))}
                    {selectedContributor.category === 'feature_contributor' && (
                      <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-blue-400" />
                        {selectedContributor.contributions} Points
                      </span>
                    )}
                    {selectedContributor.category === 'resource_contributor' && (
                      <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {selectedContributor.contributions} Points
                      </span>
                    )}
                  </div>
                )}

                {/* Social Links */}
                {(selectedContributor.social_linkedin || selectedContributor.social_github || selectedContributor.social_instagram) && (
                  <div className="flex items-center justify-center gap-4 mb-6 pt-4 border-t border-white/10">
                    {selectedContributor.social_linkedin && (
                      <a href={selectedContributor.social_linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:scale-110 transition-all border border-blue-500/20">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {selectedContributor.social_github && (
                      <a href={selectedContributor.social_github} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 hover:scale-110 transition-all border border-gray-500/20">
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {selectedContributor.social_instagram && (
                      <a href={selectedContributor.social_instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:scale-110 transition-all border border-pink-500/20">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}

                <button 
                  onClick={() => setSelectedContributor(null)}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors border border-white/10 mt-2"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
