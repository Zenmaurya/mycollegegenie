import React from 'react';
import { Skeleton } from './skeleton';

export function ResourceCardSkeleton() {
  return (
    <div className="rescard border border-gray-100 p-5 rounded-2xl flex flex-col gap-3">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="row mt-auto pt-4 border-t border-gray-100 flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 flex flex-col h-full">
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto pt-4 flex items-center justify-between">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PGCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 flex flex-col group">
      <Skeleton className="w-full h-48 rounded-none" />
      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-full">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ExchangeCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 flex flex-col group">
      <Skeleton className="w-full h-48 rounded-none" />
      <div className="p-5 flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start mb-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto pt-4 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ForumPostSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 flex gap-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <div className="flex flex-wrap gap-2 mt-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-4 mt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <div className="pl-card group block no-underline text-inherit overflow-hidden">
      <Skeleton className="w-full aspect-[16/9] rounded-2xl mb-3" />
      <div className="pl-body px-2">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-5 w-3/4 mb-3" />
        <div className="row flex justify-between items-center mt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

