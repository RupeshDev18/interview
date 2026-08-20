'use client';

import React, { useState } from 'react';
import { UserPlus, X, AlertCircle, Plus, Trash2, Briefcase, Mail, Phone, MapPin, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { candidatesService } from '@/services/candidates.service';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCandidateModal({ isOpen, onClose, onSuccess }: AddCandidateModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [currentRole, setCurrentRole] = useState('Software Engineer');
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['TypeScript', 'React', 'Node.js']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First and last names are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await candidatesService.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        currentRole: currentRole.trim() || undefined,
        experienceYears: Number(experienceYears) || 0,
        skills,
        linkedinUrl: linkedinUrl.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message || 'Failed to add candidate. Please check input fields.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-theme rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white shadow-md shadow-black/10">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-primary">Add New Candidate</h2>
              <p className="text-xs text-theme-muted">Create a candidate profile for technical interview rounds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Row 1: Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">First Name *</Label>
              <Input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Maya"
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Last Name *</Label>
              <Input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Lin"
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya.lin@example.com"
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
          </div>

          {/* Row 3: Role & Experience */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Current Role / Target Title</Label>
              <Input
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="Senior Full Stack Engineer"
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Experience (Years)</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
                className="bg-surface border-theme text-theme-primary text-xs font-mono focus-visible:ring-theme-accent"
              />
            </div>
          </div>

          {/* Row 4: Location & LinkedIn */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Location (City/Country)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA or Remote"
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">LinkedIn URL</Label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
          </div>

          {/* Skills Tag Management */}
          <div className="space-y-2 pt-2 border-t border-theme">
            <Label className="text-xs font-semibold text-theme-primary">Technical Skills & Technologies</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g. Next.js, Kafka, PostgreSQL)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="bg-surface border-theme text-xs text-theme-primary"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSkill}
                className="text-xs shrink-0 border-theme bg-surface hover:bg-surface-subtle text-theme-primary"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-theme-accent" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 text-xs bg-surface-subtle text-theme-primary border border-theme px-2.5 py-0.5 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-theme-muted hover:text-rose-500 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-theme bg-surface-subtle">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-theme-muted hover:text-theme-primary"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs gradient-theme-btn font-semibold"
          >
            {isSubmitting ? 'Creating Profile...' : 'Create Candidate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
