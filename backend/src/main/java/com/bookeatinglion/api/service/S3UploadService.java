package com.bookeatinglion.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@Slf4j
@Service
public class S3UploadService {

    private final S3Client s3Client;
    private final String bucket;
    private final String region;
    private final String cdnDomain;
    private final boolean s3Enabled;

    public S3UploadService(
            @Value("${aws.s3.bucket:team3-bookeatinglion-storage-s3}") String bucket,
            @Value("${aws.s3.region:ap-northeast-2}") String region,
            @Value("${aws.cloudfront.domain:}") String cdnDomain,
            @Value("${aws.s3.enabled:true}") boolean s3Enabled) {
        this.bucket = bucket;
        this.region = region;
        this.cdnDomain = cdnDomain;
        this.s3Enabled = s3Enabled;
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    /**
     * 카테고리 및 순번에 맞춘 S3 경로 생성 (예: books/art_03.png)
     */
    public String uploadBookCover(MultipartFile file, String category, long sequenceNumber) throws IOException {
        validatePngFile(file);

        String categoryPrefix = getCategoryPrefix(category);
        String filename = String.format("%s_%02d.png", categoryPrefix, sequenceNumber);
        String key = "books/" + filename;

        return uploadToS3(file, key);
    }

    /**
     * 범용 파일 업로드
     */
    public String uploadStream(MultipartFile file, String dirName) throws IOException {
        validatePngFile(file);

        String key = dirName + "/" + UUID.randomUUID() + ".png";
        return uploadToS3(file, key);
    }

    /**
     * PNG 전용 파일 유효성 검증 (크기, 빈 파일, MIME/확장자)
     */
    private void validatePngFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 이미지 파일이 비어있습니다.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 10MB를 초과할 수 없습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        boolean isPngExtension = originalFilename != null && originalFilename.toLowerCase().endsWith(".png");
        boolean isPngMime = "image/png".equalsIgnoreCase(contentType);

        if (!isPngExtension && !isPngMime) {
            throw new IllegalArgumentException("PNG 형식(.png)의 이미지 파일만 업로드할 수 있습니다.");
        }
    }

    private String uploadToS3(MultipartFile file, String key) throws IOException {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("image/png")
                .build();

        try (InputStream inputStream = file.getInputStream()) {
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, file.getSize()));
            log.info("S3 Streaming Upload 성공: key={}", key);
            return getCdnOrS3Url(key);
        } catch (Exception e) {
            log.error("S3 Streaming Upload 실패 (StackTrace 포함): key={}", key, e);
            throw new RuntimeException("S3 파일 업로드에 실패했습니다: " + e.getMessage(), e);
        }
    }

    private String getCdnOrS3Url(String key) {
        if (cdnDomain != null && !cdnDomain.trim().isEmpty()) {
            String baseUrl = cdnDomain.endsWith("/") ? cdnDomain.substring(0, cdnDomain.length() - 1) : cdnDomain;
            return String.format("%s/%s", baseUrl, key);
        }
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key);
    }

    private String getCategoryPrefix(String category) {
        if (category == null)
            return "book";
        return switch (category) {
            case "미술" -> "art";
            case "에세이" -> "essay";
            case "역사" -> "history";
            case "인문" -> "humanity";
            case "소설" -> "novel";
            case "과학" -> "science";
            case "자기계발" -> "self";
            default -> "book";
        };
    }
}
