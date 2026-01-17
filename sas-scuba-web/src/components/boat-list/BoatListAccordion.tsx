"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { BoatListSession } from "@/lib/api/services/boat-list.service";
import { CustomerEquipmentCard } from "./CustomerEquipmentCard";
import { Ship, Calendar, Clock, MapPin, Users, GraduationCap, ChevronDown } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";

interface BoatListAccordionProps {
    sessions: BoatListSession[];
}

export function BoatListAccordion({ sessions }: BoatListAccordionProps) {
    const [openSessions, setOpenSessions] = useState<Set<string>>(new Set());

    const toggleSession = (sessionKey: string) => {
        const newOpenSessions = new Set(openSessions);
        if (newOpenSessions.has(sessionKey)) {
            newOpenSessions.delete(sessionKey);
        } else {
            newOpenSessions.add(sessionKey);
        }
        setOpenSessions(newOpenSessions);
    };

    if (sessions.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No dive sessions found.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {sessions.map((session) => {
                const isOpen = openSessions.has(session.session_key);
                
                return (
                    <Collapsible
                        key={session.session_key}
                        open={isOpen}
                        onOpenChange={() => toggleSession(session.session_key)}
                    >
                        <Card>
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {session.boat && (
                                                <div className="flex items-center gap-2">
                                                    <Ship className="h-4 w-4 text-primary" />
                                                    <CardTitle className="text-base font-semibold">{session.boat.name}</CardTitle>
                                                </div>
                                            )}
                                            {session.dive_date && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        {safeFormatDate(session.dive_date, "MMM d, yyyy", "-")}
                                                    </span>
                                                </div>
                                            )}
                                            {session.dive_time && (
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{session.dive_time}</span>
                                                </div>
                                            )}
                                            {session.dive_site && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{session.dive_site.name}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>{session.customers.length}</span>
                                            </div>
                                            {session.dive_guides.length > 0 && (
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <GraduationCap className="h-4 w-4" />
                                                    <span>{session.dive_guides.length}</span>
                                                </div>
                                            )}
                                            <ChevronDown 
                                                className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-2 pt-0 px-4 pb-3">
                                    {/* Dive Guides Section */}
                                    {session.dive_guides.length > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                <h3 className="text-sm font-semibold">Guides</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 pl-6">
                                                {session.dive_guides.map((guide) => (
                                                    <Badge key={guide.id} variant="secondary" className="text-xs py-0.5 px-2">
                                                        {guide.full_name}
                                                        {guide.role && ` - ${guide.role}`}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Customers Section */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="text-sm font-semibold">Customers</h3>
                                        </div>
                                        <div className="grid gap-2 pl-5">
                                            {session.customers.map((customerData, index) => (
                                                <CustomerEquipmentCard 
                                                    key={`${customerData.customer.id}-${index}`} 
                                                    customerData={customerData} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                );
            })}
        </div>
    );
}

