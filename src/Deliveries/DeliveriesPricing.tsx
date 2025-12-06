import { useEffect, useState, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Polyline,
  useMap,
  useMapEvents,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  AsyncComponent,
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  RangeField,
  Scroll,
  Tip,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  getTempFromStore,
  isLoading,
  openPath,
  setFieldValue,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { isMobile } from "@biqpod/app/ui/app";
import { Geolocation } from "@capacitor/geolocation";
import {
  allIcons,
  and,
  onCollectionSnapshot,
  where,
} from "@biqpod/app/ui/apis";
import { snapbuyApi } from "../apis";
import { filterFuzzySearch, mapAsync, tw } from "@biqpod/app/ui/utils";
import { LinkingZones } from "./LinkingZones";
import { motion, AnimatePresence } from "framer-motion";
import { highlightMatch } from "../routes/Clients/ClientProductRender";
const DEFAULT_CENTER: [number, number] = [35.6892, 51.389]; // Example: Tehran, Iran
const DEFAULT_RADIUS = 2000; // meters
interface DraggableCircleProps {
  center: [number, number];
  radius: number;
  setCenter: (center: [number, number]) => void;
}
function DraggableCircle({ center, radius, setCenter }: DraggableCircleProps) {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number } }) {
      setCenter([e.latlng.lat, e.latlng.lng]);
    },
  });
  return (
    <Circle center={center} radius={radius} pathOptions={{ color: "blue" }} />
  );
}
function MoveMapToLocation({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (zoom) {
      map.setView([lat, lng], zoom);
    } else {
      map.setView([lat, lng]);
    }
  }, [lat, lng, zoom, map]);
  return null;
}
const CardInfo = () => {
  const centerX = useCopyState<number>(DEFAULT_CENTER[0]);
  const centerY = useCopyState<number>(DEFAULT_CENTER[1]);
  const radius = useCopyState<number | Nothing>(DEFAULT_RADIUS);
  const userLocation = useCopyState<[number, number] | null>(null);
  const [searchResult, setSearchResult] = useState<[number, number] | null>(
    null
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [animateCircle, setAnimateCircle] = useState<null | [number, number]>(
    null
  );
  const [animationRadius, setAnimationRadius] = useState(100);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const [currentLocationObtained, setCurrentLocationObtained] = useState(false);
  // --- Renamed to avoid redeclaration ---
  const userZones = useTemp<Biqpod.Snapbuy.Zone[]>("user-zones");
  const [zoneLinks, setZoneLinks] = useState<Biqpod.Snapbuy.LinkZone[]>([]);
  // Fetch all links between zones for the user
  useEffect(() => {
    let unsubscribes: Function[] = [];
    if (userZones.get && userZones.get.length > 0) {
      const fetchLinks = async () => {
        let allLinks: Biqpod.Snapbuy.LinkZone[] = [];
        for (const zone of userZones.get!) {
          if (!zone.id) continue;
          const links = await snapbuyApi.getZonesLinkTo(zone.id);
          for (const link of links) {
            if (link.first && link.second) {
              // Avoid duplicates
              if (
                !allLinks.some(
                  (l) =>
                    (l.first === link.first && l.second === link.second) ||
                    (l.first === link.second && l.second === link.first)
                )
              ) {
                allLinks.push(link); // keep full link object (with price)
              }
            }
          }
        }
        setZoneLinks(allLinks);
      };
      fetchLinks();
    }
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [userZones.get]);
  useEffect(() => {
    setFieldValue("search-place", "");
  }, []);
  const name = getFieldValue("place-name");

  useAction(
    "add-delivery-zone",
    async () => {
      if (!name) {
        showToast("Please enter a name for the zone", "error");
        return;
      }
      await snapbuyApi.addZone({
        centerX: centerX.get,
        centerY: centerY.get,
        radius: radius.get || DEFAULT_RADIUS,
        name,
      });
      showToast("Zone added successfully", "success");
      closePopup();
    },
    [name]
  );
  const addZoneInProccess = isLoading("add-delivery-zone");
  const search = getFieldValue("search-place");
  const handleSearch = async () => {
    if (!search) return;
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          search
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const coords: [number, number] = [
          parseFloat(data[0].lat),
          parseFloat(data[0].lon),
        ];
        setSearchResult(coords);
        // Animation logic
        setAnimateCircle(coords);
        setAnimationRadius(100);
        if (animationRef.current) clearInterval(animationRef.current);
        const duration = 2000; // 2 seconds
        const start = Date.now();
        const startRadius = 100;
        const endRadius = 1200;
        function animate() {
          const now = Date.now();
          const elapsed = now - start;
          if (elapsed < duration) {
            // Ease out
            const t = elapsed / duration;
            const eased = 1 - Math.pow(1 - t, 2);
            setAnimationRadius(startRadius + (endRadius - startRadius) * eased);
            animationRef.current = setTimeout(animate, 16); // ~60fps
          } else {
            setAnimateCircle(null);
            setAnimationRadius(startRadius);
            if (animationRef.current) clearTimeout(animationRef.current);
          }
        }
        animate();
      } else {
        setSearchResult(null);
        showToast("Place not found", "error");
      }
    } catch (e) {
      setSearchResult(null);
      showToast("Place not found", "error");
    } finally {
      setSearchLoading(false);
    }
  };
  useEffect(() => {
    if (isMobile) {
      Geolocation.getCurrentPosition().then(({ coords }) => {
        const newLocation: [number, number] = [
          coords.latitude,
          coords.longitude,
        ];
        centerX.set(coords.latitude);
        centerY.set(coords.longitude);
        userLocation.set(newLocation);
        setCurrentLocationObtained(true);
      });
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          centerX.set(position.coords.latitude);
          centerY.set(position.coords.longitude);
          userLocation.set(newLocation);
          setCurrentLocationObtained(true);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const loadingName = useCopyState(false);

  useEffect(() => {
    loadingName.set(true);
    getPlaceName([centerX.get, centerY.get])
      .then((name) => {
        const set = new Set(name.split(",").filter((s) => s.trim()));
        setFieldValue("place-name", Array.from(set).join(", "));
      })
      .finally(() => {
        loadingName.set(false);
      });
  }, [centerX.get, centerY.get]);

  return (
    <Card className="relative max-md:rounded-none max-md:w-full md:w-[80vw] max-md:h-full md:max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup title="Delivery Pricing" />
      <Line />

      <div className="flex items-center gap-2 p-2">
        <Field
          inputName="search-place"
          className="rounded-xl"
          placeholder="Search place..."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.keyCode === 13) {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        {search && (
          <div>
            <Button
              onClick={handleSearch}
              disabled={searchLoading}
              className="rounded-full"
              icon={allIcons.solid.faMagnifyingGlass}
            >
              <Translate content="search" />
            </Button>
          </div>
        )}
      </div>
      <Line />
      <div className="p-2 max-md:h-full">
        <div className="relative border border-[--biqpod-borders] border-solid rounded-2xl max-md:h-full md:h-[400px] overflow-hidden">
          <MapContainer
            center={[centerX.get, centerY.get]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* Highlight existing zones as yellow circles */}
            {userZones.get?.map((zone, idx) =>
              zone.centerX !== undefined &&
              zone.centerY !== undefined &&
              zone.radius ? (
                <Circle
                  key={idx}
                  center={[zone.centerX, zone.centerY]}
                  radius={zone.radius}
                  pathOptions={{
                    color: "yellow",
                    fillColor: "yellow",
                    fillOpacity: 0.3,
                  }}
                />
              ) : null
            )}
            {/* Draw lines between linked zones */}
            {zoneLinks.map((link, idx) => {
              const firstZone = userZones.get?.find((z) => z.id === link.first);
              const secondZone = userZones.get?.find(
                (z) => z.id === link.second
              );
              if (
                firstZone &&
                secondZone &&
                firstZone.centerX !== undefined &&
                firstZone.centerY !== undefined &&
                secondZone.centerX !== undefined &&
                secondZone.centerY !== undefined
              ) {
                return (
                  <Polyline
                    key={"link-" + idx}
                    positions={[
                      [firstZone.centerX, firstZone.centerY],
                      [secondZone.centerX, secondZone.centerY],
                    ]}
                    pathOptions={{
                      color: "#0074D9",
                      weight: 3,
                      opacity: 0.7,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                      {link.price ? `${link.price} DA` : ""}
                    </Tooltip>
                  </Polyline>
                );
              }
              return null;
            })}
            <DraggableCircle
              center={[centerX.get, centerY.get]}
              radius={radius.get || DEFAULT_RADIUS}
              setCenter={(coords) => {
                centerX.set(coords[0]);
                centerY.set(coords[1]);
              }}
            />
            {userLocation.get && currentLocationObtained && (
              <MoveMapToLocation
                lat={userLocation.get[0]}
                lng={userLocation.get[1]}
                zoom={15}
              />
            )}
            {searchResult && (
              <MoveMapToLocation
                lat={searchResult[0]}
                lng={searchResult[1]}
                zoom={13}
              />
            )}
            {animateCircle && (
              <Circle
                center={animateCircle}
                radius={animationRadius}
                pathOptions={{ color: "red", fillOpacity: 0.3 }}
              />
            )}
          </MapContainer>
        </div>
      </div>
      <Line />
      <div className="flex max-md:flex-col items-center gap-4 p-2">
        <label className="block w-full md:text-right capitalize">
          <Translate content="radius (m)" />:
        </label>
        <RangeField
          state={radius}
          config={{
            min: 1,
            max: 100000,
            isFloat: true,
            showValue: true,
          }}
          id="radius-range"
        />
      </div>
      <Line />
      <div className="flex items-center gap-2 p-2">
        {!loadingName.get && (
          <Field
            inputName="place-name"
            className="rounded-xl"
            placeholder="Enter Name..."
            rows={3}
          />
        )}
        {loadingName.get && (
          <CardWait className="rounded-2xl w-full h-[50px]" />
        )}
      </div>
      <Line />
      <div className="p-2">
        <Button
          onClick={async () => {
            execAction("add-delivery-zone");
          }}
          className="rounded-full"
        >
          <Translate content="add zone" />
        </Button>
      </div>
      {addZoneInProccess && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
// Helper to get place name from coordinates
async function getPlaceName([lat, lon]: [number, number]): Promise<string> {
  const storeNamed = getTempFromStore<string>("places." + lat + "*" + lon);
  if (storeNamed) {
    return storeNamed;
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    const name = data.display_name;
    setTemp("places." + lat + "*" + lon, name);
    return name;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}
export const DeliveriesPricing = () => {
  const zones = useTemp<Biqpod.Snapbuy.Zone[]>("user-zones");
  const user = useUser();
  const expandedZones = useCopyState<Record<string, boolean>>({});
  const linksByZone = useCopyState<Record<string, Biqpod.Snapbuy.LinkZone[]>>(
    {}
  );
  const handleExpand = async (zoneId: string) => {
    expandedZones.set((prev) => ({ ...prev, [zoneId]: !prev[zoneId] }));
    if (!linksByZone.get[zoneId]) {
      const links = await snapbuyApi.getZonesLinkTo(zoneId);
      linksByZone.set((prev) => ({ ...prev, [zoneId]: links }));
    }
  };
  useEffect(() => {
    if (user?.uid)
      return onCollectionSnapshot<Biqpod.Snapbuy.Zone>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "zones"],
        (zonesData) => {
          zones.set(zonesData.map((zone) => zone.data));
        },
        { where: and(where("uid", "==", user.uid)) }
      );
  }, [user]);
  const modeSelect = useTemp<boolean>("mode-select-zones");
  const firstSelect = useTemp<string>("first-select-zone");
  const secondSelect = useTemp<string>("second-select-zone");
  useEffect(() => {
    if (!modeSelect.get) {
      firstSelect.set(null);
      secondSelect.set(null);
    }
  }, [modeSelect.get]);
  const zonesSearchValue = getFieldValue("search-zone");
  const filteredZones = useMemo(() => {
    return filterFuzzySearch(zones.get || [], zonesSearchValue || "", "name");
  }, [zones.get, zonesSearchValue]);
  return (
    <div
      className={tw(
        "flex flex-col h-full overflow-hidden transition-[color,background] duration-200 relative",
        modeSelect.get && "bg-[--biqpod-gray-opacity]"
      )}
    >
      <div className={tw("flex  justify-between items-center px-3 py-1")}>
        <h2 className="font-bold text-lg capitalize">
          <Translate content="delivery pricing" />
        </h2>
        <div className="flex gap-2">
          <CircleTip
            onClick={() => {
              modeSelect.set(!modeSelect.get);
            }}
            className={tw(
              "transition-transform duration-300",
              modeSelect.get && "rotate-90"
            )}
            icon={
              modeSelect.get
                ? allIcons.solid.faXmark
                : allIcons.solid.faListCheck
            }
          />
          <CircleTip
            onClick={() => {
              showPopup(<CardInfo />);
            }}
            icon={allIcons.solid.faPlus}
          />
          <CircleTip
            icon={allIcons.solid.faFileExport}
            onClick={async () => {
              const [fileContent] = await openPath({
                filters: [
                  {
                    extensions: ["json"],
                    name: "*",
                  },
                ],
              });
              const data: {
                zone: Biqpod.Snapbuy.Zone;
                linked: string[];
              }[] = await fetch(fileContent).then((s) => s.json());
              const redefinedIds = data.map(({ zone }) => ({
                prevId: zone.id,
                newId: crypto.randomUUID(),
                zone,
              }));
              await mapAsync(redefinedIds, async ({ zone, newId }) => {
                await snapbuyApi.addZone({
                  ...zone,
                  id: newId,
                });
              });
            }}
          />
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Field
          inputName="search-zone"
          className="rounded-xl"
          placeholder="Search zone by name or coordinates"
        />
      </div>
      <Line />
      <div className="h-full overflow-hidden" style={{ position: "relative" }}>
        <Scroll>
          <div className="flex flex-col gap-2 p-2">
            {filteredZones?.map((zone, index) => {
              const isSelected =
                modeSelect.get &&
                (firstSelect.get === zone.id || secondSelect.get === zone.id);
              const isFirst = firstSelect.get === zone.id;
              const isSecond = secondSelect.get === zone.id;
              const linked = linksByZone.get[zone.id!];
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="flex items-center w-11/12">
                    <div>
                      <div
                        className={tw(
                          "w-[0px] overflow-hidden gap-2 flex items-center justify-center transition-[width]",
                          isSelected && "w-[40px]"
                        )}
                      >
                        <span>
                          {isFirst && "1"}
                          {isSecond && "2"}
                        </span>
                        <Icon icon={allIcons.solid.faChevronRight} />
                      </div>
                    </div>
                    <Card
                      className="w-full overflow-hidden cursor-pointer"
                      onClick={() => {
                        if (modeSelect.get) {
                          if (!firstSelect.get) {
                            if (zone.id !== undefined && zone.id !== null) {
                              // Prevent selecting as first if already second
                              if (zone.id !== secondSelect.get) {
                                firstSelect.set(zone.id);
                              }
                            }
                          } else if (firstSelect.get === zone.id) {
                            firstSelect.set(null);
                            // If secondSelect is also this zone, clear it too
                            if (secondSelect.get === zone.id) {
                              secondSelect.set(null);
                            }
                          } else if (!secondSelect.get) {
                            // Prevent selecting as second if already first
                            if (zone.id !== firstSelect.get) {
                              secondSelect.set(zone.id || null);
                            }
                          } else if (secondSelect.get === zone.id) {
                            secondSelect.set(null);
                            // If firstSelect is also this zone, clear it too
                            if (firstSelect.get === zone.id) {
                              firstSelect.set(null);
                            }
                          }
                          // Do nothing if both are set and clicked zone is neither
                        }
                      }}
                    >
                      <div className="flex justify-between items-center p-3">
                        <div>
                          <AsyncComponent
                            deps={[zone, zonesSearchValue]}
                            render={async () => {
                              if (
                                zone.centerX === undefined ||
                                zone.centerY === undefined
                              )
                                return <div>Invalid zone</div>;
                              const content = highlightMatch(
                                zone.name || "",
                                zonesSearchValue
                              );
                              return (
                                <EmptyComponent>
                                  <div className="mb-1 font-bold text-base">
                                    {content}
                                  </div>
                                </EmptyComponent>
                              );
                            }}
                            loading={
                              <div className="flex justify-center items-center">
                                <CircleLoading />
                              </div>
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <CircleTip
                            className="rounded-full"
                            icon={
                              expandedZones.get[zone.id!]
                                ? allIcons.solid.faChevronDown
                                : allIcons.solid.faChevronRight
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpand(zone.id!);
                            }}
                          />
                          <CircleTip
                            onClick={async () => {
                              const response = await confirm({
                                title: "Delete Zone",
                                message:
                                  "Are you sure you want to delete this zone?",
                                detail: `Zone: ${zone.name || "Unnamed"} (${
                                  zone.centerX
                                }, ${zone.centerY})`,
                              });
                              if (!response) {
                                return;
                              }
                              await snapbuyApi.deleteZone(zone.id || "");
                              handleExpand(zone.id!);
                            }}
                            icon={allIcons.solid.faTrash}
                          />
                        </div>
                      </div>
                      {/* Expanded links */}
                      <AnimatePresence initial={false}>
                        {expandedZones.get[zone.id!] && (
                          <motion.div
                            key="expanded-links"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <EmptyComponent>
                              <Line />
                              <div>
                                {linked ? (
                                  linked.length > 0 ? (
                                    linked.map((link) => (
                                      <div
                                        key={link.id}
                                        className="flex justify-between items-center gap-2 odd:bg-[--biqpod-primary-background] p-3"
                                      >
                                        <AsyncComponent
                                          deps={[link, zone]}
                                          render={async () => {
                                            const id =
                                              link.first === zone.id
                                                ? link.second
                                                : link.first;
                                            const zoneLink =
                                              await snapbuyApi.getZone(id!);
                                            if (!zoneLink)
                                              return <EmptyComponent />;
                                            return <span>{zoneLink.name}</span>;
                                          }}
                                          loading={
                                            <CardWait className="rounded-xl w-[200px] h-[20px]" />
                                          }
                                        />
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-green-600">
                                            {link.price}DA
                                          </span>
                                          <Tip
                                            icon={allIcons.solid.faPen}
                                            onClick={() => {
                                              const firstId = zone.id!;
                                              const secondId = (
                                                link.first === firstId
                                                  ? link.second
                                                  : link.first
                                              )!;
                                              showPopup(
                                                <LinkingZones
                                                  first={firstId!}
                                                  second={secondId}
                                                />
                                              );
                                            }}
                                          />
                                          <Tip
                                            icon={allIcons.solid.faTrash}
                                            onClick={async () => {
                                              const response = await confirm({
                                                title: "Delete Link",
                                                message:
                                                  "Are you sure you want to delete this link?",
                                                detail: `Linking ${
                                                  zone.id
                                                } with ${
                                                  link.first === zone.id
                                                    ? link.second
                                                    : link.first
                                                }`,
                                              });
                                              if (response) {
                                                await snapbuyApi.deleteLinkZone(
                                                  link.id!
                                                );
                                              }
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-2 text-gray-400 text-center">
                                      <Translate content="no linked zones" />
                                    </div>
                                  )
                                ) : (
                                  <div className="flex justify-center items-center p-2">
                                    <CircleLoading />
                                  </div>
                                )}
                              </div>
                            </EmptyComponent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </Scroll>
      </div>
      <div
        className={tw(
          "bottom-[-60px] absolute inset-x-0 w-full transform-[bottom] duration-200",
          firstSelect.get && secondSelect.get && "bottom-0"
        )}
      >
        <Line />
        <div className="p-2">
          <Button
            onClick={() => {
              if (!firstSelect.get || !secondSelect.get) {
                showToast("Please select two zones to link", "error");
                return;
              }
              showPopup(
                <LinkingZones
                  first={firstSelect.get}
                  second={secondSelect.get}
                />
              );
            }}
            className="rounded-full"
            icon={allIcons.solid.faArrowsLeftRight}
          >
            <Translate content="link zones" />
          </Button>
        </div>
      </div>
    </div>
  );
};
