import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Alchemy, Network } from 'alchemy-sdk';
import type { NextPage } from 'next';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

const imageTypeLabel: Record<string, string> = {
  high: "Ultra HD",
  normal: "Standard",
  nobg: "Transparent",
};

const imageTypeIcon: Record<string, string> = {
  high: "🖼️",
  normal: "✨",
  nobg: "💎",
};

type NFT = {
  id: string;
  name: string;
  image: string;
};

type ImageData = {
  type: string;
  data: string; // base64 data URL
  filename: string;
};

const Home: NextPage = () => {
  const { isConnected, address } = useAccount();
  const [selectedNFT, setSelectedNFT] = useState<null | NFT>(null);
  const [searchId, setSearchId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const handleModalBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setSelectedNFT(null);
  };

  // Filter NFTs by ID
  const filteredNFTs = nfts.filter((nft: NFT) => 
    searchId === '' || nft.id.toString().includes(searchId)
  );

  useEffect(() => {
    const fetchNFTs = async () => {
      setIsLoading(true);
      if (!address) return;
      const alchemy = new Alchemy({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        network: Network.ETH_SEPOLIA,
      });

      // Fetch NFTs
      let pageKey = null;
      let allNfts = [];
      do {
        const nftData: any = await alchemy.nft.getNftsForOwner(address, {
          contractAddresses: [process.env.NEXT_PUBLIC_REVERSOZ_CONTRACT_ADDRESS as string],
          pageKey: pageKey,
          pageSize: 100,
        });
        allNfts.push(...nftData.ownedNfts);
        pageKey = nftData.pageKey;
      } while (pageKey);
      const fetchedNfts: NFT[] = [];
      allNfts.forEach((nft: any) => {
        fetchedNfts.push({
          id: nft.tokenId,
          name: nft.name,
          image: nft.image.originalUrl,
        });
      });
      setNfts(fetchedNfts);
      setIsLoading(false);
    }
  
    fetchNFTs();
  }, [address]);

  useEffect(() => {
    if (selectedNFT) {
      const fetchImageData = async () => {
        setIsLoadingImages(true);
        try {
          const response = await fetch('/api/get-private-images', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nftId: selectedNFT.id
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setSelectedImages(data.images);
          } else {
            console.error('Failed to fetch image data');
            setSelectedImages([]);
          }
        } catch (error) {
          console.error('Error fetching image data:', error);
          setSelectedImages([]);
        } finally {
          setIsLoadingImages(false);
        }
      };

      fetchImageData();
    } else {
      setSelectedImages([]);
    }
  }, [selectedNFT]);

  // Function to download image data
  const downloadImage = (imageData: ImageData) => {
    const link = document.createElement('a');
    link.href = imageData.data;
    link.download = imageData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center py-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 mb-6 drop-shadow-2xl tracking-tight">
            REVERSOZ Gallery
          </h1>
          <p className="text-xl text-white/70 font-medium max-w-2xl mx-auto">
            Discover, collect, and download your reversoz NFTs in stunning quality
          </p>
        </div>

        {/* Connect Button */}
        <div className="mb-8">
          <ConnectButton />
        </div>
        
        {isConnected ? (
          <>
            {/* Search Input */}
            <div className="w-full max-w-md mb-12">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by NFT ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white placeholder-white/50 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-6"></div>
                <h3 className="text-2xl font-bold text-white mb-2">Loading Your NFTs</h3>
                <p className="text-white/70">Fetching your collection from the blockchain...</p>
              </div>
            ) : (
              <>
                {/* NFT Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 w-full max-w-7xl">
                  {filteredNFTs.map((nft, index) => (
                    <div
                      key={nft.id}
                      className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 cursor-pointer hover:scale-105 hover:-translate-y-3 transition-all duration-500 hover:shadow-3xl hover:border-white/40"
                      onClick={() => setSelectedNFT(nft)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                      
                      {/* Card Content */}
                      <div className="relative z-10">
                        <div className="relative w-full aspect-square mb-6 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-gradient-to-br from-white/20 to-white/5">
                          <Image
                            src={nft.image}
                            alt={nft.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/20 backdrop-blur-md rounded-full p-4">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <h2 className="text-xl font-bold text-white text-center drop-shadow-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-blue-400 transition-all duration-300">
                          {nft.name}
                        </h2>
                        <p className="text-center text-white/60 text-sm mt-1">ID: {nft.id}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No results message */}
                {filteredNFTs.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-white mb-2">No NFTs Found</h3>
                    <p className="text-white/70">Try searching for a different ID</p>
                  </div>
                )}

                {/* Stunning Modal */}
                {selectedNFT && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-4"
                    onClick={handleModalBgClick}
                  >
                    <div className="relative bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-2xl rounded-3xl p-8 max-w-4xl w-full shadow-2xl border border-white/30 animate-slide-up overflow-hidden">
                      {/* Modal Background Glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl"></div>
                      
                      {/* Close Button */}
                      <button
                        className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 transition-all duration-200 hover:scale-110 z-50 hover:cursor-pointer"
                        onClick={() => setSelectedNFT(null)}
                        aria-label="Close"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6L18 18M6 18L18 6" />
                        </svg>
                      </button>
                      
                      {/* Modal Content */}
                      <div className="relative z-10">
                        <h2 className="text-5xl font-black text-center text-white mb-8 drop-shadow-lg bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text">
                          {selectedNFT.name}
                        </h2>
                        
                        {isLoadingImages ? (
                          <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-6"></div>
                            <h3 className="text-2xl font-bold text-white mb-2">Loading Images</h3>
                            <p className="text-white/70">Fetching your images from the server...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {selectedImages.map((imageData) => (
                              <div key={imageData.type} className="flex flex-col items-center">
                                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 mb-6 bg-gradient-to-br from-white/20 to-white/5 group">
                                  <Image
                                    src={imageData.data}
                                    alt={`${imageData.type} image`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                
                                <button
                                  onClick={() => downloadImage(imageData)}
                                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 hover:from-pink-400 hover:to-blue-400 transition-all duration-300 text-center min-w-[140px] justify-center hover:cursor-pointer"
                                >
                                  <span className="text-xl">{imageTypeIcon[imageData.type] || "⬇️"}</span>
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm leading-none">Download</span>
                                    <span className="text-xs leading-none opacity-90">{imageTypeLabel[imageData.type] || imageData.type}</span>
                                  </div>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedImages.length === 0 && !isLoadingImages && (
                          <div className="text-center py-12">
                            <div className="text-6xl mb-4">🖼️</div>
                            <h3 className="text-2xl font-bold text-white mb-2">No Images Available</h3>
                            <p className="text-white/70">Images for this NFT are not available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
              <div className="text-6xl mb-6">🔐</div>
              <h2 className="text-3xl font-bold text-white mb-4">Unlock Your Collection</h2>
              <p className="text-white/70 text-lg max-w-md mx-auto">
                Connect your wallet to explore and download your exclusive NFT collection
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        @keyframes slide-up {
          from { 
            transform: translateY(60px) scale(0.9); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </div>
  );
};

export default Home;
